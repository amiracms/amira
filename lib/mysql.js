"use strict";

const mysql = require('mysql');
const _ = require('underscore');

module.exports = class MySQL {
	name = 'MySQL'

	lastId

	#config

	#connect

	#queued = 0

	#release = 0

	constructor(config) {
		const defaults = {
			host: 'localhost',
	        port: 3306,
	        localAddress: "",
	        socketPath: "",
	        user: "",
	        password: null,
	        database: null,
	        charset: null,
	        timezone: "UTC",
	        connectTimeout: 10000,
	        stringifyObjects: false,
	        insecureAuth: false,
	        typeCast: true,
	        queryFormat: null,
	        supportBigNumbers: true,
	        bigNumberStrings: true,
	        dateStrings: true,
	        debug: false,
	        trace: false,
	        localInfile: false,
	        multipleStatements: false,
	        connectionLimit: 50
		};

		this.#config = _.defaults(config, defaults);

		if (this.#config.ssl) {
			// Add rejection variable
			this.#config.ssl.rejectUnauthorized = true
		}
	}

	connect() {
		const conn = mysql.createConnection(this.#config);

		return new Promise(res => {
			conn.connect( err => {
                conn.end();

                if (err) {
                    res([err]);

                    return;
                }

                res([null, true]);
            });
		});
	}

	/**
	 * Executes SQL query.
	 * 
	 * @param {string} sql
	 * @param {array} options
	 **/
	query(sql, options) {
		if (!this.#connect) {
			this.#connect = mysql.createPool(this.#config);
			this.#queued = 0;
			this.#release = 0;

			// Listen to connection event
			this.#connect.on('queue', this.#addQueue.bind(this));
			this.#connect.on('release', this.#addRelease.bind(this));
		}

		return new Promise(res => {
			this.#connect.query(sql, options, (error, results, fields) => {
				// Remove queue
				this.#queued -= 1;

				if (error) {
					res([error]);

					return;
				}

				res([null, results, fields]);
			});
		});
	}

	#addQueue() {
		this.#queued += 1;
	}

	#addRelease() {
		this.#release += 1;
	}

	close() {
		if (!this.#connect) {
			this.#queued = 0;
			this.#release = 0;

			return;
		}

		this.#connect.end( () => {
			this.#queued = 0;
			this.#release = 0;
			this.#connect = false;
		});
	}

	table_name(name) {
		return this.#config.prefix + name;
	}

	insert(table, columns) {
		if (!_.isArray(columns)) {
			// Remove column with no corresponding value
			const data = _.pick(columns, v => !!v);

			return this.query(
				'INSERT INTO ?? SET ?',
				[
					this.table_name(table),
					data
				]
			);
		}

		const list = _.keys(_.first(columns));

		return this.query(
			'INSERT INTO ?? (??) VALUES ?',
			[
				this.table_name(table),
				list,
				columns
			]
		);
	}

	update(table, columns, where) {
		const tableName = this.table_name(table);
		const format = [tableName, columns];
		const sql = ['UPDATE ?? SET ?'];

		if (where) {
			const _where = this.#whereClause(where, tableName, format);

			sql.push(`WHERE ${_where}`);
		}

		return this.query(sql.join(' '), format);
	}

	get({
		table,
		columns = '*',
		where,
		groupBy,
		orderBy,
		perPage,
		page = 1
	}) {
		const tableName = this.table_name(table);
		const column = this.#prepareColumn(columns, tableName);
		const sql = [`SELECT ${column} FROM ??`];
		const format = [tableName];

		if (where) {
			const _where = this.#whereClause(where, tableName, format);

			sql.push(`WHERE ${_where}`);
		}

		if (groupBy) {
			sql.push(this.#groupBy(groupBy, format));
		}

		if (orderBy) {
			sql.push(this.#orderBy(orderBy, table));
		}

		if (perPage && perPage > 0) {
			sql.push(this.#limit(page, perPage));
		}

		return this.query(sql.join(' '), format);
	}

	async get_row(table, where) {
		const [err, rows] = await this.get({table, where, perPage: 1, page: 1});

		return [err, rows && _.first(rows)];
	}

	async get_var(table, column, where) {
		const [, row] = await this.get_row(table, where);

		return row && row[column];
	}

	delete(table, where) {
		const tableName = this.table_name(table);
		const format = [tableName];
		const sql = ['DELETE FROM ??'];

		if (where) {
			const _where = this.#whereClause(where, tableName, format);

			sql.push(`WHERE ${_where}`);
		}

		return this.query(sql.join(' '), format);
	}

	#prepareColumn(columns, tableName) {
		if ('*' === columns) {
			return columns;
		}

		columns = columns.split(',').map(c => c.trim());

		return columns
			.reduce(
				(c, col) => {
					c.push(`${tableName}.${col}`);

					return c;
				},
				[]
			)
			.join(' ');
	}

	#whereClause(where, table, format) {
		const $and = [];
		const $or = [];
		const operators = {
			$gt: '> ?',
            $gte: '>= ?',
            $lt: '< ?',
            $lte: '<= ?',
            $not: '!= ?',
            $in: 'IN (?)',
            $notIn: 'NOT IN (?)',
            $like: 'LIKE ?',
            $notLike: 'NOT LIKE ?',
            $between: 'BETWEEN ? AND ?',
            $notBetween: 'NOT BETWEEN ? AND ?',
            $exist: 'IS NOT NULL',
            $isNull: 'IS NULL'
		};

		const mapCondition = (column, con, value, arr) => {
	        let currentOperator = operators[con] || '= ?';

	        // Replace asterisk with %
	        if ('$like' === con && '$notlike' === con) {
	            value = value.replace(/\*/g, '%');
	        }

	        if ('$fn' === con) {
	            arr.push(`${column}(${value})`);
	        } else {
	            arr.push(`${table}.${column} ${currentOperator}`);
	        }

	        if ('$between' === con) {
	            _format = _format.concat(value);

	            return;
	        }

	        format.push(value);
	    };

	    const mapWhere = (key, value, arr) => {
	        if (!_.isObject(value)) {
	            return mapCondition(key, false, value, arr);
	        }

	        _.forEach( value, (v, k) => mapCondition(key, k, v, arr));
	    }

	    _.keys(where).map( key => {
	        let value = where[key];

	        switch(key) {
	            default :
	                mapWhere(key, value, $and);

	                break;

	            case '$and' :
	                _.forEach( value, (v, k) => mapWhere(k, v, $and));

	                break;

	            case '$or' :
	                _.forEach( value, (v, k) => mapWhere(k, v, $or));

	                break;
	        }
	    });

	    let _where = [];

	    if ($and.length) {
	        _where.push(`(${$and.join(' AND ')})`);
	    }

	    if ($or.length) {
	        _where.push(`(${$or.join(' OR ')})`);
	    }

	    return _where.join(' AND ');
	}

	#groupBy(groupBy, format) {
		if (_.isString(groupBy)) {
	        return ` GROUP BY ${groupBy}`;
	    }

	    if (_.isArray(groupBy)) {
	        return ` GROUP BY ` + groupBy.join(', ');
	    }

	    // Assume an object
	    let groups = [],
	        having = [];

	    _.forEach(groupBy, (def, column) => {
	        if (_.isObject(def)) {
	            let key = _.first(_.keys(def)),
	                value = _.first(_.values(def));

	            if (mods[key]) {
	                having.push(`${column} ${mods[key]} ?`);
	                format.push(value);

	                return;
	            }

	            // TODO: double check other possible group by modifier
	        }

	        if (_.isString(def) && _.contains(['asc', 'desc'], def.toLowerCase())) {
	            groups.push(`${column} ${def}`);

	            return;
	        }

	        // Assume it's one of MySQL functions
	        groups.push(`${def.toUpperCase()}(${column})`);
	    });

	    let sql = `GROUP BY ` + groups.join(', ');

	    if (having) {
	        sql += ` HAVING ${having.join(', ')}`;
	    }

	    return sql;
	}

	#orderBy(orderBy, table) {
		if (_.isString(orderBy)) {
	        return `ORDER BY ${table}.${orderBy}`;
	    }

	    if (_.isArray(orderBy)) {
	        let order = _.map( orderBy, o => {
	            o = __toArray(o);

	            return `${table}.${o[0]} ${o[1]}`;
	        });

	        return `ORDER BY ${order.join(', ')}`;
	    }

	    return `ORDER BY ${_.first(_.keys(orderBy))} ${_.first(_.values(orderBy))}`
	}

	#limit(page, perPage) {
		const offset = (page * perPage) - perPage;

		return `LIMIT ${offset}, ${perPage}`;
	}
}