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
exports.consumeMessages = exports.produceMessage = void 0;
const kafkajs_1 = require("kafkajs");
// Initialize Kafka client
const kafka = new kafkajs_1.Kafka({
    clientId: 'my-node-app',
    brokers: ['kafka:29092'], // Use the name of the Kafka service in Kubernetes
});
// Producer function to send messages to a topic
function produceMessage(topic, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = kafka.producer();
        yield producer.connect();
        console.log(`Producing message to ${topic}: ${message}`);
        yield producer.send({
            topic,
            messages: [{ value: message }],
        });
        yield producer.disconnect();
    });
}
exports.produceMessage = produceMessage;
// Consumer function to consume messages from a topic
function consumeMessages(topic) {
    return __awaiter(this, void 0, void 0, function* () {
        const consumer = kafka.consumer({ groupId: 'my-group' });
        yield consumer.connect();
        yield consumer.subscribe({ topic, fromBeginning: true });
        console.log(`Consuming messages from ${topic}`);
        yield consumer.run({
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ message }) {
                var _b;
                console.log(`Received message: ${(_b = message === null || message === void 0 ? void 0 : message.value) === null || _b === void 0 ? void 0 : _b.toString()}`);
            }),
        });
    });
}
exports.consumeMessages = consumeMessages;
