import { Form, InputGroup, Col, Stack } from "react-bootstrap";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Floppy,
  PersonCircle,
  ArrowClockwise,
  Building,
} from "react-bootstrap-icons";

import { useState, useContext } from "react";
import { AppContext } from "../contexts/AppContext";

function Settings() {
  const { username, setUsername, company, setCompany, sendMessage } =
    useContext(AppContext);
  console.log(username);

  const [tempUsername, setTempUsername] = useState(username);
  const [tempCompany, setTempCompany] = useState(company);

  const [savedText, setSavedText] = useState("");

  const onSave = async function () {
    setCompany(tempCompany);
    setUsername(tempUsername);
    setSavedText("Saved!");
    sendMessage("register " + tempUsername + " " + tempCompany, tempUsername);
    await new Promise((res) => setTimeout(res, 3000));
    setSavedText("");
  };

  const onReset = () => {
    setTempCompany(company);
    setTempUsername(username);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                placeholder="username"
                aria-label="Message"
                id="message"
                value={tempUsername}
                onChange={(event) => {
                  setTempUsername(event.target.value);
                }}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                placeholder="company"
                aria-label="Message"
                id="message"
                value={tempCompany.toUpperCase()}
                onChange={(event) => {
                  setTempCompany(event.target.value.toUpperCase());
                }}
              />
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button onClick={onReset} variant="outline danger">
          Reset
        </Button>
        <Button onClick={onSave}>Save</Button>
      </CardFooter>
    </Card>
  );
}

export default Settings;
