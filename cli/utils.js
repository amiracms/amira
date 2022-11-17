"use strict";

const readLine = require("readline");
const _ = require("underscore");
const path = require("path");

exports.Prompt = function Prompt(questions, data) {
    let names = _.keys(questions);

    const getNext = () => {
        if (!names.length) {
            return data;
        }

        let name = names.shift(),
            q = questions[name];

        q = _.isObject(q) ? q : {label: q};

        let {label, required, value, desc, callback} = q;

        return Question({
            question: label, 
            name, 
            data, 
            required, 
            value: data[name]||value, 
            desc, 
            callback
        }).then(getNext);
    };

    return getNext();
}

function Question({question, name, data, required, value, desc, callback}) {
    let reader = getReader();
    let q = question;

    q += value ? ` (${value}): ` : ': ';

    return new Promise( res => {
        reader.question(q, answer => {
            answer = answer.trim();
            answer = answer || value;

            res(answer);
        });
    })
        .then( answer => {
            reader.close();

            if (!answer && required) {
                return Question({question, name, data, required, value, desc});
            }

            data[name] = answer;

            if (callback) {
                return callback.call(null);
            }

            return answer;
        });
}

function getReader() {
    return readLine.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function clearLine() {
    readLine.clearLine(process.stdout, 0);
    readLine.cursorTo(process.stdout, 0);
}