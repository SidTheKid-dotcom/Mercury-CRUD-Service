const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client configuration
const client = new Client({
  node: 'https://e0c8499567524524a9201c165c9674d5.us-central1.gcp.cloud.es.io:443',  // Use the elasticseach url
  auth: {
    apiKey: "bHdUeXFwTUIwUWNoZnhrLTN3OUs6TWN6N1lidEpUNmlxUUR6ekJ4OTBtUQ=="
  }
});

export default client;