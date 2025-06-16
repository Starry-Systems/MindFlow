import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import MindmapPage from "@/pages/mindmap";
import MindmapListPage from "@/pages/mindmaps";
import React, { useEffect, useState } from 'react';

function useAuth() {
  const [isLoading, setLoading] = useState(true);
  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/__replauthuser');
        if (response.ok) {
          const userData = await response.json();
          setAuthenticated(!!userData);
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching auth:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isLoading, isAuthenticated };
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`${window.location.origin.replace(/^http/, 'ws')}/`);

    ws.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (message) => {
    const ws = new WebSocket(`${window.location.origin.replace(/^http/, 'ws')}/`);
    ws.onopen = () => {
      ws.send(message);
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={MindmapListPage} />
        <Route path="/mindmaps" component={MindmapListPage} />
        <Route path="/mindmap/:id" component={MindmapPage} />
        <Route component={NotFound} />
      </Switch>
      <div>
        <textarea onBlur={(e) => sendMessage(e.target.value)} placeholder="Type your message..." />
        <div>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;