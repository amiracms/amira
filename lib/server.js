"use strict";

const [,,mode] = process.argv;

/**
 * The main application object.
 * 
 * Use to hold all data properties that are use in different flows
 * of the server.
 **/
module.exports = new class Server {
	version = '1.0.0'

	isDev = 'dev' === mode

	#config = require('./config')()

	#actions = {}

	#filters = {}

	#req

	#res

	#typeDef = {}

	#resolvers = {}

	#directives = []

	#staticPaths = []

	#scripts = []

	#css = []

	db = require('./db')()

	/**
	 * Sets the applications requests variables.
	 * 
	 * @private
	 **/
	__set(req, res) {
		this.#req = req;
		this.#res = res;
	}

	/**
	 * Returns the value of the given configuration name.
	 * 
	 * @param {string} name
	 * 	The property name of present in the configuration to get the value at.
	 * @returns {*}
	 **/
	config(name) {
		return this.#config[name] && this.#config[name];
	}

	/**
	 * Sets action listener of the given action name.
	 * 
	 * @param {string} action
	 * 	The name of the action event to add the listener to.
	 * @param {function} callback
	 * 	The function to call when the action event name is triggered.
	 * @returns {void}
	 **/
	on(action, callback) {
		const actions = this.#actions[action]||[];

		actions.push(callback);

		this.#actions[action] = actions;
	}

	/**
	 * Call the given action name to execute the listeners.
	 * 
	 * @async
	 * 
	 * @param {string} action
	 * 	The action event name to trigger to.
	 * @param ...
	 * 	Any additional arguments to satisfy the execution of the
	 * 	action event.
	 * @returns {void}
	 **/
	trigger(action, ...args) {
		const actions = this.#actions[action];

		if (!actions) {
			return;
		}

		actions
			.reduce(
				(p, f) => p.then(a => f.apply(null, ...args)),
				Promise.resolve(args)
			);
	}

	/**
	 * Sets a filter listener event base on the given filter name.
	 * 
	 * @param {string} filter
	 * 	The name of the filter event to set the listener to.
	 * @param {function} callback
	 * 	The callable function which listens to the filter event.
	 * @return {void}
	 **/
	filter(filter, callback) {
		const filters = this.#filters[filter]||[];

		filters.push(callback);

		this.#filters[filter] = filters;
	}

	/**
	 * Calls all filter listeners of the given filter event name.
	 * 
	 * @param {string} filter
	 * 	The name of the filter event to call the listeners to.
	 * @param {*} value
	 * 	The value to which the listeners may modify.
	 * @param ...
	 * 	Any additional arguments to satisfy the filter's listeners.
	 * @return {*}
	 **/
	applyFilters(filter, value, ...args) {
		const filters = this.#filters[filter];

		if (!filters) {
			return value;
		}

		return filters
			.reduce(
				(p, f) => p.then(a => f.apply(null, a, ...args)),
				Promise.resolve(value)
			);
	}

	/**
	 * Sets GraphQL definition and it's corresponding resolvers
	 * and directives.
	 * 
	 * Note that directives must be defined in the type definition itself.
	 * 
	 * @param {string} typeDef
	 * 	A typeScript type definition.
	 * @param {object} resolvers
	 * 	A list of property name/value which corresponds to the declared
	 * 	type definiton.
	 * 	Each property value must be a callable function which handles
	 * 	how the type definition is process.
	 * @param {array<Object>} directives
	 * 	The list of directives definition which are defined in the type definition.
	 * 
	 * 	Each object of the list contains the following properties 
	 * 	{
	 *		@property {string} name
	 * 			The name of the directive without the '@' prefix
	 * 		@property {boolean} isAfter
	 * 			Whether the directive should be called after processing
	 * 			the result of the field resolver. Default is false.
	 * 		@property {function} resolve
	 * 			The callable function to call when the directive is in use.
	 * 	}
	 **/
	gql_schema({typeDef, resolvers = {}, directives = []}) {
		// Don't set type def previously set
		if (this.#typeDef[typeDef]) {
			return;
		}

		this.#typeDef[typeDef] = typeDef;

		this.#resolvers = Object.entries(resolvers)
			.reduce(
				(r, [name, callback]) => {
					if (!r[name]) {
						r[name] = callback;

						return r;
					}

					r[name] = {...r[name], ...callback};

					return r;
				},
				this.#resolvers
			);

		this.#directives = [
			...this.#directives,
			...directives
		];
	}

	get_typeDef() {
		return Object.values(this.#typeDef);
	}

	get_resolvers() {
		const {ObjectType, ArrayType, DateTime} = require('./gql/types');

		return {
			Object: ObjectType,
			Array: ArrayType,
			DateTime,
			...this.#resolvers
		}
	}

	get_directives() {
		return this.#directives;
	}

	/**
	 * Add static path to render to HTML document.
	 * 
	 * @param {string} absPath
	 * 	The absolute location of the folder to which the resources are stored.
	 * @param {string} pathName
	 * 	An alias path name to set as prefix to the relative location of the resource.
	 * @returns {void}
	 **/
	staticPath(absPath, pathName) {
		this.#staticPaths.push({absPath, pathName});
	}

	/**
	 * Returns the list of static paths to set on the screen.
	 * @returns {array<object>}
	 **/
	get_static_paths() {
		return this.#staticPaths;
	}

	/**
	 * Returns the value of the given header name if exist.
	 * 
	 * @param {string} name
	 * 	The name of the header value to get to.
	 * @returns {*}
	 **/
	get_header(name) {
		return this.#req && this.#req.header(name);
	}

	/**
	 * Set response header.
	 * 
	 * @param {string} name
	 * 	The name of the header to set to.
	 * @param {*} value
	 * 	The corresponding value of the given header name.
	 **/
	set_header(name, value) {
		return this.#res && this.#res.set(name, value);
	}

	/**
     * Get the value of the given cookie name.
     * 
     * @param {string} name
     *      The name of the stored cookie to get to.
     * @return {*}
     **/
	get_cookie(name) {
		return this.#req && this.#req.cookies && this.#req.cookies[name];
	}

	/**
     * Sets header cookie.
     **/
	set_cookie({
		name,
        value,
        expires,
        ssl,
        httpOnly,
        cookiePath = "/",
        cookieDomain,
        sameSite = true
	}) {
		if (!this.#res) {
			// throw an error??
			return;
		}

		const args = {
            expires,
            maxAge: expires,
            path: cookiePath,
            domain: cookieDomain || this.#req.hostname,
            ssl,
            httpOnly,
            sameSite
        };

        return this.#res.cookie(name, value, args);
	}

	/**
	 * Generates new session Id to use in the screen.
	 * 
	 * @param {string} key
	 * 	The key to base the session Id at. If omitted, will
	 * 	use the application's unique client Id.
	 * @returns {string}
	 **/
	async create_session_id(key) {
		const {generateHashKey} = require('./utils');

		key = key || this.config('clientId');

		const [err, hash] = await generateHashKey(key);

		if (err) {
			// todo: log error
			return false;
		}

		this.set_header('X-Session-Id', hash);
		this.set_cookie({
			name: '__sid__',
			value: hash,
			expires: Date.now() + (86400 * 6000 * 30)
		});

		return hash;
	}

	/**
	 * Returns current session Id if present
	 **/
	get_session_id() {
		return this.get_header('x-session-id')
			||this.get_cookie('__sid__');
	}

	add_script({devSrc, src, ver}) {
		this.#scripts.push({devSrc, src, ver});
	}

	get_scripts() {
		const isAdmin = 'admin' === this.client;
		const scripts = [...this.#scripts];

		// Add the bundle
		scripts.unshift({
			devSrc: isAdmin ? '/script/admin.js' : '/script/admin.js',
			src: isAdmin ? '/admin/script/admin.min.js' : '/admin/script/admin.min.js',
			ver: this.version
		});

		return scripts;
	}

	print_scripts(scripts) {
		const isDev = this.isDev;

		return scripts
			.map(
				({devSrc, src, ver = this.version}) => 
					`<script type="text/javascript" src="${isDev ? devSrc : src}?v=${ver}"></script>`
			)
			.join('\r\n\t')
	}

	add_css({devSrc, src, ver, rel, type}) {
		this.#css.push({
			devSrc, 
			src, 
			ver: ver || this.version,
			media: 'all',
			rel: rel||'stylesheet',
			type: type||'text/css'
		});
	}

	get_css() {
		const css = [...this.#css];
		const isAdmin = 'admin' === this.client;

		// Add default css
		if (isAdmin) {
			css.unshift({
				devSrc: '/admin/css/admin.css',
				src: '/admin/css/admin.min.css',
				ver: this.version,
				media: 'all',
				rel: 'stylesheet',
				type: 'text/css'
			})
		}

		return css;
	}

	print_css(cssList) {
		return cssList
			.map(
				({devSrc, src, ver, media, rel}) => {
					const href = this.isDev ? devSrc||src : src;
					const v = this.isDev ? (new Date()).getTime() : ver;

					const attr = Object
						.entries({
							href: `${href}?v=${v}`,
							media,
							rel
						})
						.reduce(
							(a, [name, value]) => {
								if (!value) {
									return a;
								}

								a.push(`${name}="${value}"`);

								return a;
							},
							[]
						)
						.join(' ');

					return `<link ${attr}/>`;
				}
			)
			.join('\r\n\t');
	}
}