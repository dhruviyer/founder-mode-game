import { Col, Row } from "react-bootstrap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../contexts/AppContext.jsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function MyCompany() {
  const {
    outputData,
    companyData,
    revenueData,
    setRevenueData,
    cashData,
    setCashData,
  } = useContext(AppContext);

  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    const newRevenueData = [
      ...revenueData.slice(-5),
      { timestamp: revenueData.length + 1, revenue: companyData["arr"] },
    ];
    setRevenueData(newRevenueData);

    const newCashData = [
      ...cashData.slice(-5),
      { timestamp: cashData.length + 1, cash: companyData["cash"] },
    ];
    setCashData(newCashData);
  }, [companyData]);

  const chartConfig = {
    revenue: {
      label: "revenue",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Col className="text-foreground text-left">
      <h1 className="mb-3 text-4xl font-semibold tracking-tight">
        {"name" in companyData ? companyData["name"] : "My Company"}
      </h1>
      <div className="">
        <ScrollArea className="h-[60vh]">
          <Row className="mb-4">
            <Col>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <LineChart
                      accessibilityLayer
                      data={revenueData}
                      isAnimationActive={false}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <YAxis />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) =>
                              `Revenue: ${USDollar.format(value)}`
                            }
                            hideLabel
                          />
                        }
                      />
                      <Line
                        dataKey="revenue"
                        type="natural"
                        stroke="#0565ff"
                        strokeWidth={3}
                        dot={{
                          fill: "#0565ff",
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </Col>
            <Col>
              <Card>
                <CardHeader>
                  <CardTitle>Cash</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <LineChart
                      accessibilityLayer
                      data={cashData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <YAxis
                        tickFormatter={(value) =>
                          "$" + Math.round(value / 1000) + "K"
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) =>
                              `Cash: ${USDollar.format(value)}`
                            }
                          />
                        }
                      />
                      <Line
                        dataKey="cash"
                        type="natural"
                        stroke="#0565ff"
                        strokeWidth={3}
                        dot={{
                          fill: "#0565ff",
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </Col>
          </Row>
          <div className="border-[3px] rounded-3xl mb-4">
            <Table className="text-foreground">
              <TableBody>
                <TableRow className="border-none ">
                  <TableCell>
                    <b>Valuation:</b>
                  </TableCell>
                  <TableCell>
                    {USDollar.format(companyData["valuation"])}
                  </TableCell>
                  <TableCell>
                    <b>Cash:</b>
                  </TableCell>
                  <TableCell>{USDollar.format(companyData["cash"])}</TableCell>
                </TableRow>
                <TableRow className="border-none">
                  <TableCell>
                    <b>Features:</b>
                  </TableCell>
                  <TableCell>
                    {Math.round(companyData["features"] * 100) / 100}
                  </TableCell>
                  <TableCell>
                    <b>ARR:</b>
                  </TableCell>
                  <TableCell>{USDollar.format(companyData["arr"])}</TableCell>
                </TableRow>
                <TableRow className="border-none">
                  <TableCell>
                    <b>Quality:</b>
                  </TableCell>
                  <TableCell>
                    {100 - Math.round(companyData["quality"] * 100)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <Table className="overflow-scroll">
            <ScrollArea className="h-[60vh]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(outputData).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <i>No Data.</i>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.keys(outputData).map((key) => {
                    return (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{outputData[key]["priority"]}</TableCell>
                        <TableCell>{outputData[key]["skill"]}</TableCell>
                        <TableCell>
                          {USDollar.format(outputData[key]["salary"])}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </ScrollArea>
          </Table>
        </ScrollArea>
      </div>
    </Col>
  );
}

export default MyCompany;
