'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCopy, Instagram, ChevronDown, ChevronUp, X, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

type DisplayFormat = 'plain' | 'comma' | 'json'

type Notification = {
  message: string;
  type: 'success' | 'error';
}

function isValidWord(word: string): boolean {
  return /^[а-яА-ЯөӨүҮёЁa-zA-Z\s]+$/.test(word);
}

export function Page() {
  const [words, setWords] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState('')
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('json')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/words`

  useEffect(() => {
    fetchWords()
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchWords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/words', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      })
      if (!response.ok) {
        throw new Error(`Үгсийг авчрахад алдаа гарлаа: ${response.statusText}`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setWords(data)
        console.log('Fetched words:', data)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        throw new Error('Хүлээн авсан өгөгдөл хүчингүй байна')
      }
    } catch (error) {
      console.error('Үгсийг авчрахад алдаа гарлаа:', error)
      setNotification({ message: 'Үгсийг ачаалж чадсангүй. Дахин оролдоно уу.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const saveWords = async (newWords: string[]) => {
    setIsSaving(true)
    try {
      const invalidWords = newWords.filter(word => !isValidWord(word));
      if (invalidWords.length > 0) {
        throw new Error(`Буруу оролт: "${invalidWords.join(', ')}" нь зөвхөн үсэг агуулаагүй байна`);
      }

      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify(newWords),
      })
      const data = await response.json()
      if (data.success) {
        setWords(data.words)
        setNotification({ message: `${data.addedCount} үг нэмэгдлээ. Нийт үгийн тоо: ${data.wordCount}`, type: 'success' })
        console.log('Words saved successfully:', data.addedWords)
        console.log('Updated word list:', data.words)
      } else {
        throw new Error(data.error || 'Үг хадгалахад алдаа гарлаа')
      }
    } catch (error) {
      console.error('Үг хадгалахад алдаа гарлаа:', error)
      setNotification({ 
        message: error instanceof Error ? error.message : "Үг хадгалахад алдаа гарлаа. Дахин оролдоно уу.", 
        type: 'error' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentWord.trim() && !isSaving) {
      const newWords = currentWord.split(',').map(word => word.trim()).filter(word => word !== '')
      await saveWords(newWords)
      setCurrentWord('')
      await fetchWords() // Fetch words again after saving
    }
  }

  const formatWords = (format: DisplayFormat): string => {
    switch (format) {
      case 'plain':
        return words.join('\n')
      case 'comma':
        return words.join(', ')
      case 'json':
      default:
        return JSON.stringify(words, null, 2)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      setNotification({ message: 'Өгөгдлийг таны clipboard-д хуулсан.', type: 'success' })
    }).catch((err) => {
      console.error('Хуулахад алдаа гарлаа:', err)
      setNotification({ message: 'Өгөгдлийг хуулахад алдаа гарлаа.', type: 'error' })
    })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Ачаалж байна...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Монгол хараалын үгс</h1>
      
      <div className="text-center mb-8 max-w-md mx-auto">
        <p className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-full' : 'max-h-20 overflow-hidden'}`}>
          Энэхүү төсөл нь интернет орчин дахь дарамт, доромжлол болон сөрөг үг хэллэгийг 
          таньж, түүнтэй тэмцэх зорилготой. <br/><br/>Монгол хэлний хараалын үгс болон бусад 
          хортой хэллэгүүдийг цуглуулж, тэдгээрийг таних, шүүх, улмаар эерэг, хүндэтгэлтэй 
          харилцааг дэмжихийг хүссэний үүднээс энэ сайтыг эхлүүллээ.<br/><br/>Энэ мэдээллийг ашиглан бид цахим орчин дахь 
          хэл яриаг сайжруулж, илүү аюулгүй, эерэг орчныг бий болгоход хувь нэмрээ оруулах 
          болно. Та шинэ үг нэмэх, одоо байгаа үгсийг харах боломжтой бөгөөд энэ нь зөвхөн 
          судалгаа, боловсрол, мэдээллийн зорилгоор ашиглагдана.
        </p>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="mt-2"
        >
          {isExpanded ? (
            <>
              хаах <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              дэлгэрэнгүй <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {notification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded shadow-lg flex items-center justify-between max-w-sm w-full" 
             role="alert"
             style={{
               backgroundColor: notification.type === 'success' ? 'rgba(220, 252, 231, 0.95)' : 'rgba(254, 226, 226, 0.95)',
               color: notification.type === 'success' ? '#047857' : '#B91C1C',
             }}>
          <p>{notification.message}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotification(null)}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Card className="max-w-md mx-auto mb-8">
        <CardHeader>
          <CardTitle>Үг нэмэх ({words.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value)}
              placeholder="Үг оруулна уу (таслалаар тусгаарлан олон үг оруулж болно)"
              disabled={isSaving}
            />
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Нэмж байна...' : 'Үг нэмэх'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <div className="w-full mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Button
                variant={displayFormat === 'plain' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayFormat('plain')}
              >
                Жагсаалт
              </Button>
              <Button
                variant={displayFormat === 'comma' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayFormat('comma')}
              >
                Таслалтай
              </Button>
              <Button
                variant={displayFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayFormat('json')}
              >
                JSON
              </Button>
            </div>
          </div>
          <div className="w-full relative">
            <h2 className="text-lg font-semibold mb-2">Урьдчилан харах:</h2>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0"
              onClick={() => copyToClipboard(formatWords(displayFormat))}
              aria-label="Clipboard-д хуулах"
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <pre className="whitespace-pre-wrap">
                {formatWords(displayFormat)}
              </pre>
            </ScrollArea>
          </div>
        </CardFooter>
      </Card>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>REST API URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={apiUrl}
              readOnly
              className="flex-grow"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(apiUrl)}
              className="flex-shrink-0"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <a 
            href="https://www.instagram.com/buyakublai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <Instagram className="w-4 h-4 mr-1" />
            buyakublai
          </a>
          <a 
            href="https://buyakublai.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            buyakublai.com
          </a>
        </div>
      </footer>
    </div>
  )
}