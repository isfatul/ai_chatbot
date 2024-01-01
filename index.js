const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);



const threads = {
  thread1: {
    message: [],
    persona: "", // Enter your persona here
  },
  thread2: {
    message: [],
    persona: "", // Enter your persona here
  },
};

async function conversation() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  var threadID = 0;
  const chatbot1 = model.startChat({
    history: threads.thread1.message,
  });
  const chatbot2 = model.startChat(
    {
      history: threads.thread2.message,
    }
  );

  var result1 = await chatbot1.sendMessage(`Start a conversation with another bot. Just the starting, not the whole conversation. Your persona is: ${threads.thread1.persona}. When done with the whole conversation you can type "All Done" to end the conversation.`);
  var response1 = await result1.response;
  console.log("----Response 1----")
  console.log(response1.text());
  threads.thread1.message.push(response1.text());

  var result2 = await chatbot2.sendMessage(`Reply to: ${response1.text()}. No need of the entire conversation, just the reply to the given text. Your persona is: ${threads.thread2.persona}. When done with the whole conversation you can type "All Done" to end the conversation.`);
  var response2 = await result2.response;
  console.log("----Response 2----")
  console.log(response2.text());
  threads.thread2.message.push(response2.text());

  while (!(response1.done || response2.done || response1.text().includes("All Done") || response2.text().includes("All Done") || response1.text().includes("End of Conversation") || response2.text().includes("End of Conversation"))) {
    result1 = await chatbot1.sendMessage(response2.text());
    response1 = await result1.response;
    result2 = await chatbot2.sendMessage(response1.text());
    response2 = await result2.response;
    console.log("----Response 1----")
    console.log(response1.text());
    if (response1.text().includes("All Done") || response1.text().includes("End of Conversation")) {
      threads.thread1.message.push(response1.text());
      // threads.thread2.message.push("End of Conversation");
      break;
    }
    console.log("----Response 2----")
    console.log(response2.text());
    if (response2.text().includes("All Done") || response2.text().includes("End of Conversation")) {
      threads.thread2.message.push(response2.text());
      // threads.thread1.message.push("End of Conversation");
      break;
    }
    threads.thread1.message.push(response1.text());
    threads.thread2.message.push(response2.text());
  }
  saveResultsToJSON();
}

function saveResultsToJSON() {
  const existingData = fs.existsSync('results.json') ? JSON.parse(fs.readFileSync('results.json')) : {};
  const newData = { timestamp: new Date(), ...threads };
  const updatedData = [newData];
  if (existingData && existingData.length) {
    updatedData.push(...existingData);
  }
  fs.writeFileSync('results.json', JSON.stringify(updatedData, null, 2));
}

conversation();