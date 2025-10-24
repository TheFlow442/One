
'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KeyRound, ExternalLink } from "lucide-react";
import Link from "next/link";

export function ApiKeySetup() {

    return (
        <Alert>
            <KeyRound className="h-4 w-4" />
            <AlertTitle>Set up your Gemini API Key</AlertTitle>
            <AlertDescription>
                The AI-powered features of this dashboard are currently disabled. To enable them, you need to generate a free API key from Google AI Studio and add it to your project.
            </AlertDescription>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                 <Button asChild>
                    <Link href="https://aistudio.google.com/app/apikey" target="_blank">
                       <ExternalLink className="mr-2 h-4 w-4" /> Generate API Key
                    </Link>
                </Button>
                <div className="flex flex-col text-sm text-muted-foreground">
                    <span>1. Click the button to create your key.</span>
                    <span>2. Copy the key and paste it into the `.env` file in your project as `GEMINI_API_KEY=YOUR_KEY_HERE`.</span>
                </div>
            </div>
        </Alert>
    );
}
