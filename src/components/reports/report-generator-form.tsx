'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Download, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ReportGeneratorFormProps {
  onGenerate: () => void;
  isLoading: boolean;
}

export function ReportGeneratorForm({ onGenerate, isLoading }: ReportGeneratorFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download /> Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : <span>dd/mm/yyyy</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : <span>dd/mm/yyyy</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="community">Community</Label>
            <Select disabled={isLoading}>
              <SelectTrigger id="community">
                <SelectValue placeholder="Community (A/B/C or All)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Last 14 days)</SelectItem>
                <SelectItem value="a" disabled>Community A (coming soon)</SelectItem>
                <SelectItem value="b" disabled>Community B (coming soon)</SelectItem>
                <SelectItem value="c" disabled>Community C (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select disabled={isLoading}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Format (AI Summary)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai">AI Summary</SelectItem>
                <SelectItem value="csv" disabled>CSV (coming soon)</SelectItem>
                <SelectItem value="pdf" disabled>PDF (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full" onClick={onGenerate} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
