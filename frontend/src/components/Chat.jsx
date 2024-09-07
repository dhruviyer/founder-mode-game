import { ListGroup, Row, Col } from "react-bootstrap";
import { SendIcon } from "lucide-react";
import { useEffect, useState, useRef, useContext } from "react";
import { AppContext } from "../contexts/AppContext.jsx";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Chat() {
  const { messages, sendMessage, laborData } = useContext(AppContext);

  const [message, setMessage] = useState("");

  const [chat, setChat] = useState("");

  const [chats, setChats] = useState({
    "(New Chat)": {
      messages: [],
      read: true,
    },
    admin: {
      messages: [],
      read: true,
    },
  });

  const refreshChats = () => {
    let newChats = {
      "(New Chat)": {
        messages: [],
        read: true,
      },
      admin: {
        messages: [],
        read: true,
      },
    };

    messages.forEach((msg) => {
      let _chat = msg.sender.replace("You (to ", "").replace(")", "");
      if (!(_chat in newChats)) {
        newChats[_chat] = {
          messages: [],
          read: true,
        };
      }
      newChats[_chat]["messages"].push({
        sender: msg.sender.startsWith("You") ? "You" : msg.sender,
        message: msg.message,
      });

      Object.keys(chats).forEach((chat) => {
        if (!newChats[chat]) {
          return;
        }
        if (chats[chat]["messages"] != newChats[chat]["messages"]) {
          newChats[chat]["read"] =
            !newChats[chat]["messages"].at(-1) ||
            newChats[chat]["messages"].at(-1).sender == "You";
        } else {
          newChats[chat]["read"] = true;
        }
      });
    });
    return newChats;
  };

  const onClick = (event) => {
    if (chat !== "(New Chat)") {
      sendMessage("/" + chat.toLowerCase() + " " + message);
    } else if (chat !== "") {
      setChat(message.split(" ")[0].substring(1));
      sendMessage(message);
    }
    setMessage("");
  };

  useEffect(() => {
    scroll.current.scrollIntoView({ behavior: "smooth" });
    setChats(refreshChats());
  }, [messages]);

  const handleKeyDown = (e) => {
    if (showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          setMessage("/" + filteredCommands[selectedIndex].name + " ");
          setShowCommands(false);
          inputRef.current?.focus();
        } else {
          onClick();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          setMessage("/" + filteredCommands[selectedIndex].name + " ");
          setShowCommands(false);
          inputRef.current?.focus();
        }
      }
    } else if (e.key === "Enter") {
      onClick();
    }
  };

  const commands = Object.keys(laborData).map((key) => {
    return {
      name: key,
      description: `Send a message to ${key}`,
    };
  });

  console.log(laborData);
  console.log(commands);

  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef();

  const scroll = useRef();

  useEffect(() => {
    if (chat == "(New Chat)" && message.startsWith("/")) {
      setShowCommands(true);
      const filtered = commands.filter((cmd) =>
        cmd.name.toLowerCase().startsWith(message.slice(1).toLowerCase())
      );
      setFilteredCommands(filtered);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
    }
  }, [message]);

  return (
    <div className="text-foreground text-left">
      <Row className="border-[5px] border-solid bg-background p-3 min-h-[60vh]">
        <Col md={4}>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight">Chat</h1>
          <Table>
            <ScrollArea className="h-[40vh]">
              <TableBody>
                {chats &&
                  Object.keys(chats).map((chatName) => {
                    return (
                      <TableRow className="border-none rounded-3xl">
                        <TableCell
                          onClick={() => {
                            setChat(chatName);
                            setShowCommands(false);

                            let new_chats = { ...chats };
                            new_chats[chatName]["read"] = true;
                            setChats(new_chats);
                          }}
                          className={`rounded border-none ${chatName === chat ? "bg-muted" : ""}`}
                        >
                          <p>{chatName}</p>
                          <p
                            className={
                              chats[chatName]["read"]
                                ? "font-thin"
                                : "font-bold "
                            }
                          >
                            {chats[chatName]["messages"].at(-1) &&
                              (
                                (chats[chatName]["messages"].at(-1).sender ===
                                "You"
                                  ? "You: "
                                  : "") +
                                chats[chatName]["messages"].at(-1).message
                              ).slice(0, 30) + "..."}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </ScrollArea>
          </Table>
        </Col>
        <Col className="border-[5px] border-solid bg-background rounded-3xl min-h-[77vh]">
          <div className="w-full pb-3 px-1 min-h-[77vh] max-h-[77vh] flex flex-col justify-end">
            <ListGroup
              className=" bg-transparent text-foreground"
              style={{ overflowY: "auto" }}
            >
              {chats &&
                chats[chat] &&
                chats[chat]["messages"].map((message, index) => {
                  return (
                    <ListGroup.Item
                      key={index}
                      className="bg-transparent !text-foreground border-0 text-start"
                    >
                      <span
                        className={
                          message.sender.startsWith("You")
                            ? "text-foreground"
                            : " text-red-500"
                        }
                      >
                        {message.sender}:
                      </span>{" "}
                      {message.message}
                    </ListGroup.Item>
                  );
                })}
              <ListGroup.Item
                ref={scroll}
                className="border-0 bg-transparent text-start "
              ></ListGroup.Item>
            </ListGroup>

            <div className="w-full relative ">
              <div className="absolute bottom-full w-full mb-2">
                {showCommands && (
                  <ScrollArea className="w-full rounded-lg shadow-lg max-h-60">
                    {filteredCommands.map((cmd, index) => (
                      <div
                        key={cmd.name}
                        className={`p-3 cursor-pointer ${
                          index === selectedIndex
                            ? "bg-gray-700"
                            : "hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          setMessage("/" + cmd.name + " ");
                          setShowCommands(false);
                          inputRef.current?.focus();
                        }}
                      >
                        <span className="font-bold text-gray-200">
                          /{cmd.name}
                        </span>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
              <div className="flex outline-none items-stretch">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    "Type a message" +
                    (chat == "(New Chat)" ? " or / for recipients" : "")
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-grow py-2 px-3 border-2 !rounded-r-none focus-visible:ring-transparent !border-r-0 rounded-l-lg placeholder-gray-400"
                />
                <Button
                  disabled={chat === ""}
                  variant="primary"
                  id="send"
                  onClick={onClick}
                  className="px-4 bg-blue-500 hover:bg-blue-600 text-white !rounded-l-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 border-2 border-blue-500"
                >
                  <SendIcon className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Chat;
