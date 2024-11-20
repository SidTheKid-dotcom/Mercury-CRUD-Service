"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Client } = require('@elastic/elasticsearch');
// Elasticsearch client configuration
const client = new Client({
    node: 'http://elasticsearch_container:9200', // Use the container name instead of localhost
});
exports.default = client;
