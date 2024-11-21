const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client configuration
const client = new Client({
  node: 'http://elasticsearch_container:9200',  // Use the container name instead of localhost
  requestTimeout: 10000 // 10 seconds timeout
});

export default client;