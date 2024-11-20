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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishEvent = exports.connectToRabbitMQ = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
let channel = null;
let connection = null;
const connectToRabbitMQ = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Establish a connection
        connection = yield amqplib_1.default.connect("amqp://rabbitmq_container:5672");
        channel = yield connection.createChannel();
        console.log("Connected to RabbitMQ");
        // Ensure the queue exists
        const queue = "crud-service-events";
        yield channel.assertQueue(queue, { durable: true });
    }
    catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        process.exit(1); // Exit the process if RabbitMQ is unavailable
    }
});
exports.connectToRabbitMQ = connectToRabbitMQ;
const publishEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }
    const queue = "crud-service-events";
    const message = Buffer.from(JSON.stringify(event));
    channel.sendToQueue(queue, message);
    console.log("Event published:", event);
});
exports.publishEvent = publishEvent;
