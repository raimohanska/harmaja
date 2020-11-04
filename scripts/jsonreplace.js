#!/usr/bin/env node
fs = require("fs")
const [file, field, value] = process.argv.slice(2)

if (!value) {
    console.error("USAGE: jsonreplace <file> <field> <value>")
    process.exit(1)
}

const text = fs.readFileSync(file, "utf-8")
const json = JSON.parse(text)
json[field]=value
fs.writeFileSync(file, JSON.stringify(json, null, 2), "utf-8")