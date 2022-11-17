"use strict";

/**
 * The main application object.
 * 
 * Use to hold all data properties that are use in different flows
 * of the server.
 **/
module.exports = new class Server {
	#config = require('./config')()

	#actions = {}

	#filters = {}

	#typeDef = []

	#resolvers = {}

	#directives = {}

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
	 * 		@property {string}
	 * 			A short description describing what the directive is about
	 * 		@property {string} description
	 * 			Depraction reason if the directive is depracated.
	 * 		@property {array} locations
	 * 			The list of locations where the directive may appear.
	 * 		@property {function} resolve
	 * 			The callable function to call when the directive is in use.
	 * 	}
	 **/
	gql_schema(typeDef, resolvers = {}, directives = []) {
		this.#typeDef.push(typeDef);

		Object.entries(
			([name, callback]) => {
				if (!this.#resolvers[name]) {
					this.#resolvers[name] = callback;

					return;
				}

				// Assume it's an object type
				this.#resolvers[name] = {
					...this.#resolvers[name],
					[name]: callback
				}
			});

		this.#directives = [
			...this.#directives,
			...directives
		]
	}
}