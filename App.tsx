import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentMessage, setCurrentMessage] = useState(null);
  const websocket = useRef(null);

  useEffect(() => {
    websocket.current = new WebSocket("ws://localhost:8100/stream/chatbot/ws/");
    
    websocket.current.onopen = () => {
      console.log("Conexão WebSocket estabelecida"); 
    };

    websocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Mensagem recebida do WebSocket:", data);
      const responseMessage = {
        id: data.id,
        text: data.message,
        user: "ChatGPT",
      };

      setCurrentMessage((prevMessage) => {
        if (prevMessage && prevMessage.id === responseMessage.id) {
          const updatedMessage = { ...prevMessage, text: responseMessage.text };
          setMessages((previousMessages) => [updatedMessage, ...previousMessages.slice(1)]);
          return updatedMessage;
        } else {
          setMessages((previousMessages) => [responseMessage, ...previousMessages]);
          return responseMessage;
        }
      });
    };

    websocket.current.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    websocket.current.onclose = () => {
      console.log("Conexão WebSocket fechada");
    };

    return () => {
      websocket.current.close();
    };
  }, []);


  const sendMessage = async () => {
    if (text.trim() === "") return;

    const newMessage = {
      id: Math.random().toString(36).substring(7),
      text: text,
      user: "Me",
    };

    setMessages((previousMessages) => [newMessage, ...previousMessages]);
    setText("");

    try {
      console.log("Enviando mensagem para o WebSocket:", newMessage.text);
      websocket.current.send(newMessage.text);
    } catch (error) {
      console.error("Erro ao enviar mensagem para o WebSocket:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={item.user === "Me" ? styles.myMessage : styles.chatGPTMessage}>
      <Text
        style={
          item.user === "Me" ? styles.myMessageText : styles.chatGPTMessageText
        }
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholderTextColor={'gray'}
          value={text}
          onChangeText={setText}
          placeholder="Pergunte a Ema IA"
        />
        <Button title="Enviar" onPress={sendMessage} color={"#6a0dad"} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 40 : 0,
    padding: 5,
    marginTop: 30,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginRight: 10,
    paddingLeft: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6a0dad",
    padding: 10,
    borderRadius: 16,
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: "70%",
  },
  myMessageText: {
    color: "#fff",
  },
  chatGPTMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e1bee7",
    padding: 10,
    borderRadius: 16,
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: "70%",
  },
  chatGPTMessageText: {
    color: "#000",
  },
});
