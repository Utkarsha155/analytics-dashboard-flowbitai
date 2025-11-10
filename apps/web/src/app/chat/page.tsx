"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Defines the shape of the data row in the results table
type ResultRow = Record<string, string | number>;

export default function ChatWithDataPage() {
  const [question, setQuestion] = useState("");
  const [sql, setSql] = useState("");
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    // Clear previous results and set loading
    setSql("");
    setResults(null);
    setIsLoading(true);

    const currentQuestion = question.trim();
    setQuestion(""); // Clear the input box

    try {
      // This calls your deployed Node.js API
      const res = await fetch(`${API_URL}/chat-with-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await res.json();

      if (data.error) {
        setSql(`--- AI Server Error ---\n${data.error}`);
        setResults([]);
        return;
      }

      // Groq returns results as a JSON string array, which we must parse
      const parsedResults = JSON.parse(data.results_json);

      setSql(data.sql);
      setResults(parsedResults);

    } catch (error) {
      setSql("Connection Error: Could not reach the Node.js API.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to display dynamic table headers
  const getHeaders = () => {
    if (!results || results.length === 0) return [];
    return Object.keys(results[0]);
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-muted/40 sm:pl-14">
      {/* Header & Sidebar (Yahan Header aur Sidebar ko import karna padega, but for now we focus on the content) */}

      <div className="flex-1 p-4 md:px-6 md:py-8 space-y-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" /> Chat with Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 1. Chat Interface */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="E.g., What is the total spend in the last 90 days?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="shrink-0">
                {isLoading ? "Thinking..." : <Send className="h-4 w-4" />}
              </Button>
            </form>

            {/* 2. Results Display */}
            {(sql || isLoading || (results && results.length > 0)) && (
              <div className="mt-6 space-y-4">
                {/* SQL Output */}
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="p-4 pt-4">
                    <p className="text-xs font-semibold mb-2 text-gray-500">
                      Generated SQL:
                    </p>
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                      {isLoading ? "Generating SQL..." : sql}
                    </pre>
                  </CardContent>
                </Card>

                {/* Results Table */}
                {results && results.length > 0 && (
                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Results ({results.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {getHeaders().map((header) => (
                                <TableHead key={header} className="capitalize">
                                  {header.replace(/_/g, " ")}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.map((row, index) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value, idx) => (
                                  <TableCell key={idx} className="font-medium text-xs">
                                    {String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}