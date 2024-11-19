import amqp from "amqplib";

let channel: amqp.Channel | null = null;
let connection: amqp.Connection | null = null;

export const connectToRabbitMQ = async () => {
    try {
        // Establish a connection
        connection = await amqp.connect("amqp://rabbitmq_container:5672");
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");

        // Ensure the queue exists
        const queue = "crud-service-events";
        await channel.assertQueue(queue, { durable: true });

    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        process.exit(1); // Exit the process if RabbitMQ is unavailable
    }
};

export const publishEvent = async (event: Record<string, any>) => {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    const queue = "crud-service-events";
    const message = Buffer.from(JSON.stringify(event));
    channel.sendToQueue(queue, message);
    console.log("Event published:", event);
};
