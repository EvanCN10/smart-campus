import * as mqtt from "mqtt";
import * as dotenv from "dotenv";

dotenv.config();

const brokerUrl =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Logger Subscriber] Menghubungkan ke ${brokerUrl}...`);

const client = mqtt.connect(brokerUrl, {
  clientId: `subscriber_logger_${Math.random().toString(16).slice(3)}`,
});

client.on("connect", () => {
  console.log("[Logger Subscriber] Terhubung!");

  // Fitur MQTT: Wildcard Subscription
  // Menggunakan '#' untuk men-subscribe semua sub-topic di bawah 'campus/'
  // Dashboard adalah Subscriber 1, script ini adalah Subscriber 2
  // Rubric: Shared Subscription (opsional, pakai env var MQTT_SHARED_GROUP)
  const baseTopic = "campus/#";
  const group = process.env.MQTT_SHARED_GROUP;
  const topicToSubscribe = group ? `$share/${group}/${baseTopic}` : baseTopic;

  client.subscribe(topicToSubscribe, { qos: 1 }, (err) => {
    if (!err) {
      console.log(
        `[Logger Subscriber] Subscribed to ${topicToSubscribe} with QoS 1`,
      );
    } else {
      console.error("[Logger Subscriber] Subscribe error:", err);
    }
  });
});

client.on("message", (topic, message, packet) => {
  // Hanya log topic penting agar console tidak terlalu penuh
  if (
    topic.includes("alerts") ||
    topic.includes("announcements") ||
    topic.includes("system")
  ) {
    console.log(
      `[LOGGER] Topic: ${topic} | QoS: ${packet.qos} | Retained: ${packet.retain}`,
    );
    if (packet.properties) {
      const props: any = packet.properties;
      if (props.userProperties) {
        console.log(
          `[LOGGER] UserProperties: ${JSON.stringify(props.userProperties)}`,
        );
      }
      if (typeof props.messageExpiryInterval === "number") {
        console.log(
          `[LOGGER] MessageExpiryInterval: ${props.messageExpiryInterval}s`,
        );
      }
      if (props.correlationData) {
        console.log(
          `[LOGGER] CorrelationData: ${props.correlationData.toString()}`,
        );
      }
    }
    console.log(`[LOGGER] Payload: ${message.toString()}\n`);
  }
});
