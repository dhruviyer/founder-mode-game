import "./App.css";

import { Col, Container, Row } from "react-bootstrap";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs.tsx";

import "bootstrap/dist/css/bootstrap.min.css";
import Settings from "./components/Settings.jsx";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import LaborMarket from "./components/LaborMarket.jsx";
import MyCompany from "./components/MyCompany.jsx";
import Chat from "./components/Chat.jsx";
import { AppContext } from "./contexts/AppContext.jsx";

import { ModeToggle } from "@/components/mode-toggle.tsx";
import { Route, Routes, Link } from "react-router-dom";
import { GearFill } from "react-bootstrap-icons";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [messages, setMessages] = useState([]);
  const [laborData, setLaborData] = useState({});
  const [outputData, setOutputData] = useState({});
  const [company, setCompany] = useState(localStorage.getItem("company") || "");
  const [companyData, setCompanyData] = useState({});

  const WS_URL = "ws://localhost:8081";

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: true,
      shouldReconnect: () => true,
      onError: () => {},
      onOpen: () => {
        if (localStorage.getItem("company")) {
          sendMessage(
            "register " +
              localStorage.getItem("username") +
              " " +
              localStorage.getItem("company"),
            localStorage.getItem("username")
          );
        }
      },
    }
  );

  const sendMessage = (message, sender = username) => {
    sendJsonMessage({
      method: "message",
      message: message,
      sender: sender,
    });
  };

  useEffect(() => {
    if (lastJsonMessage != null) {
      if (lastJsonMessage.type === "message") {
        setMessages((messages) => [
          ...messages,
          {
            message: lastJsonMessage.message,
            sender: lastJsonMessage.sender,
          },
        ]);
      } else {
        console.log(lastJsonMessage);
        if ("employees" in lastJsonMessage) {
          setLaborData((laborData) => {
            var newData = {};
            lastJsonMessage["employees"].forEach((record) => {
              var innerData = {};
              innerData["employer"] = record["employer"];
              innerData["salary"] = record["salary"];
              innerData["skill"] = record["skill"];
              innerData["type"] = record["type"];
              newData[record["name"]] = innerData;
            });
            return newData;
          });
        }

        if ("company" in lastJsonMessage) {
          setCompanyData((companyData) => {
            const record = lastJsonMessage["company"][0];
            var innerData = {};
            innerData["name"] = record["name"];
            innerData["cash"] = record["cash"];
            innerData["features"] = record["features"];
            innerData["valuation"] = record["valuation"];
            innerData["arr"] = record["arr"];
            return innerData;
          });
        }

        if ("outputs" in lastJsonMessage) {
          setOutputData((outputData) => {
            var newData = {};
            lastJsonMessage["outputs"].forEach((record) => {
              var innerData = {};
              innerData["name"] = record["name"];
              innerData["priority"] = record["priority"];
              innerData["skill"] = record["skill"];
              innerData["salary"] = record["salary"];
              newData[record["name"]] = innerData;
            });
            console.log(newData);
            return newData;
          });
        }
      }
    }
  }, [lastJsonMessage]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="App min-h-screen bg-muted pt-2">
        <NavigationMenu
          style={{ justifyContent: "flex-start" }}
          className="bg-background mx-auto max-w-[99%] mb-3 border-accent rounded-3xl border-solid border-[1px]"
        >
          <NavigationMenuList className="my-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link to="/" className="no-underline text-foreground">
                  Home
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link to="/settings" className="!no-underline text-foreground">
                  Settings
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <ModeToggle />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <AppContext.Provider
          value={{
            username,
            setUsername,
            messages,
            setMessages,
            company,
            setCompany,
            laborData,
            setLaborData,
            outputData,
            setOutputData,
            companyData,
            setCompanyData,
            sendMessage,
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <Row className="px-4">
                  <Col>
                    <Chat />
                  </Col>
                  <Col md={5}>
                    <Tabs
                      defaultValue="laborMarket"
                      className="border-[5px] border-solid bg-background py-3 px-4 rounded-3xl min-h-[83vh] max-h-[83vh]"
                    >
                      <TabsList className="mb-3">
                        <TabsTrigger value="laborMarket">
                          Labor Market
                        </TabsTrigger>
                        <TabsTrigger value="myCompany">My Company</TabsTrigger>
                      </TabsList>
                      <TabsContent value="laborMarket">
                        <LaborMarket />
                      </TabsContent>
                      <TabsContent value="myCompany">
                        {" "}
                        <MyCompany />
                      </TabsContent>
                    </Tabs>
                  </Col>
                </Row>
              }
            />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppContext.Provider>
      </div>
    </ThemeProvider>
  );
}

export default App;
