"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEventToKafka = void 0;
const kafkajs_1 = require("kafkajs");
const kafka = new kafkajs_1.Kafka({
    clientId: 'crud-service',
    //brokers: ['kafka-service:9092'],  // Kafka service endpoint (Kubernetes DNS)
    brokers: ['localhost:9092'],
});
const producer = kafka.producer();
// Function to send events to Kafka
function sendEventToKafka(event) {
    return __awaiter(this, void 0, void 0, function* () {
        yield producer.connect();
        yield producer.send({
            topic: 'event-log', // Kafka topic
            messages: [{ value: JSON.stringify(event) }],
        });
        console.log('Event sent:', event);
    });
}
exports.sendEventToKafka = sendEventToKafka;
