const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client configuration
const client = new Client({
  node: 'https://my-elasticsearch-project-d0942f.es.us-east-1.aws.elastic.cloud:443',  // Use the elasticseach url
  auth: {
    apiKey: "NWhscVQ1TUJGdElsZ2FScFdkano6d1NTOWVIZEdSYXF4NXVjNWFoakdkUQ=="
  }
});

export default client;