"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageCircle, Send, Brain, Database, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar"; // Import Sidebar
import { Header } from "@/components/Header";   // Import Header
import { cn } from "@/lib/utils";

// --- Types ---
type ResultRow = Record<string, string | number>;

// Type for a single message in our chat history
type ChatMessage = {
  id: number;
  question: string;
  sql: string;
  results: ResultRow[] | null;
  error?: string;
};

export default function ChatWithDataPage() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // This state now holds *all* previous conversations
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || isLoading) return;

    setIsLoading(true);
    setQuestion(""); // Clear the input box

    // Create a temporary message to show "Thinking..."
    const tempId = Date.now();
    setHistory((prev) => [
      ...prev,
      {
        id: tempId,
        question: currentQuestion,
        sql: "Generating SQL...",
        results: null,
      },
    ]);

    try {
      // Call your Node.js API
      const res = await fetch(`${API_URL}/chat-with-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await res.json();

      if (data.error || !res.ok) {
        // Update the temporary message with the error
        setHistory((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  sql: `--- AI Server Error ---`,
                  error: data.error || "Failed to fetch from API.",
                  results: [],
                }
              : msg
          )
        );
        return;
      }

      // Parse the results (which are a JSON string)
      const parsedResults = JSON.parse(data.results_json);

      // Update the temporary message with the real data
      setHistory((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                sql: data.sql,
                results: parsedResults,
              }
            : msg
        )
      );
    } catch (error) {
      // Handle network errors
      setHistory((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                sql: "--- Connection Error ---",
                error: "Could not reach the Node.js API.",
                results: [],
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get headers for a *specific* table
  const getHeaders = (results: ResultRow[] | null) => {
    if (!results || results.length === 0) return [];
    return Object.keys(results[0]);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* --- 1. Sidebar (Added) --- */}
      <Sidebar />

      <main className="flex flex-1 flex-col ml-60">
        {/* --- 2. Header (Added) --- */}
        <Header />

        {/* --- 3. Chat Content --- */}
        <div className="flex-1 p-6 space-y-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-primary" />
                Chat with Data
              </CardTitle>
              <CardDescription>
                Ask questions about your data in plain English.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* --- 4. Chat History (Improved) --- */}
              <div className="space-y-6">
                {history.map((msg) => (
                  <div key={msg.id} className="space-y-4">
                    {/* User's Question */}
                    <div className="flex justify-end">
                      <p className="rounded-lg bg-primary text-primary-foreground p-3 max-w-[70%] text-sm">
                        {msg.question}
                      </p>
                    </div>

                    {/* AI's Response (SQL + Table) */}
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Database className="h-4 w-4" />
                      </span>
                      <div className="space-y-4 w-full">
                        {/* SQL Card */}
                        <Card className="bg-muted border-dashed">
                          <CardContent className="p-4 pt-4">
                            <p className="text-xs font-semibold mb-2 text-gray-500">
                              Generated SQL:
                            </p>
                            <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                              {msg.sql}
                            </pre>
                          </CardContent>
                        </Card>

                        {/* Error Card */}
                        {msg.error && (
                          <Card className="border-red-500 bg-red-50 text-red-700">
                            <CardContent className="p-4 pt-4">
                              <p className="text-sm font-medium">
                                {msg.error}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Results Table */}
                        {msg.results && msg.results.length > 0 && (
                          <Card className="border-2">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                Results ({msg.results.length})
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="max-h-60 overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {getHeaders(msg.results).map((header) => (
                                        <TableHead
                                          key={header}
                                          className="capitalize"
                                        >
                                          {header.replace(/_/g, " ")}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {msg.results.map((row, index) => (
                                      <TableRow key={index}>
                                        {Object.values(row).map(
                                          (value, idx) => (
                                            <TableCell
                                              key={idx}
                                              className="font-medium text-xs"
                                            >
                                              {String(value)}
                                            </TableCell>
                                          )
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- 5. Input Form (Stays at the bottom) --- */}
              <form
                onSubmit={handleSubmit}
                className="flex gap-2 mt-6 pt-6 border-t"
              >
                <Input
                  placeholder="E.g., What is the total spend in the last 90 days?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}