import { Col, Container, Row } from "react-bootstrap";

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

import { useState, useContext } from "react";
import { AppContext } from "../contexts/AppContext";

function Settings() {
  const { username, setUsername, company, setCompany, sendMessage } =
    useContext(AppContext);

  const [tempUsername, setTempUsername] = useState(username);
  const [tempCompany, setTempCompany] = useState(company);

  const [investor, setInvestor] = useState("");
  const [amount, setAmount] = useState("");
  const [postMoneyValuation, setPostMoneyValuation] = useState("");

  const [savedText, setSavedText] = useState("");

  const onSave = async function () {
    setCompany(tempCompany);
    setUsername(tempUsername);
    setSavedText("Saved!");
    sendMessage("register " + tempUsername + " " + tempCompany, tempUsername);
    localStorage.setItem("username", tempUsername);
    localStorage.setItem("company", tempCompany);
    await new Promise((res) => setTimeout(res, 3000));
    setSavedText("");
  };

  const onReset = () => {
    setTempCompany(company);
    setTempUsername(username);
  };

  const onInvest = () => {
    sendMessage(
      "/admin invest " +
        amount +
        " " +
        company +
        " " +
        postMoneyValuation +
        " " +
        investor,
      tempUsername
    );
  };

  return (
    <Container>
      <Row>
        <Col>
          <Card className="w-[350px] text-foreground !border-none">
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
              <Button onClick={onReset} variant="destructive">
                Reset
              </Button>
              <div>
                <Label className="mr-2">{savedText}</Label>
                <Button className="bg-gray-100" onClick={onSave}>
                  Save
                </Button>
              </div>
            </CardFooter>
          </Card>
        </Col>
        <Col>
          <Card className="w-[350px] text-foreground !border-none">
            <CardHeader>
              <CardTitle>Invest</CardTitle>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="investor">Investor</Label>
                    <Input
                      placeholder="Investor name"
                      aria-label="Investor"
                      id="investor"
                      value={investor}
                      onChange={(event) => {
                        setInvestor(event.target.value);
                      }}
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      placeholder="Investment amount"
                      aria-label="Amount"
                      id="amount"
                      type="text"
                      onChange={(event) => {
                        const v = event.target.value.replace(/\D/g, "");
                        const formattedAmount = new Intl.NumberFormat().format(
                          v
                        );
                        event.target.value = "$" + formattedAmount;
                        console.log(v);
                        setAmount(parseFloat(v));
                      }}
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="valuation">Post Money Valuation</Label>
                    <Input
                      placeholder="Post money valuation"
                      aria-label="Valuation"
                      id="valuation"
                      type="text"
                      onChange={(event) => {
                        const v = event.target.value.replace(/\D/g, "");
                        const formattedAmount = new Intl.NumberFormat().format(
                          v
                        );
                        event.target.value = "$" + formattedAmount;
                        setPostMoneyValuation(parseFloat(v));
                      }}
                    />
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex justify-between">
              <div>
                <Button className="bg-green-600" onClick={onInvest}>
                  Invest
                </Button>
              </div>
            </CardFooter>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Settings;
