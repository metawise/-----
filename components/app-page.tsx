'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCopy, Instagram } from "lucide-react"

type DisplayFormat = 'plain' | 'comma' | 'json'

export function Page() {
  const [words, setWords] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState('')
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('json')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchWords()
  }, [])

  const fetchWords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/words', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
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

  const saveWord = async (newWord: string) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(newWord),
      })
      const data = await response.json()
      if (data.success) {
        setWords(data.words)
        setNotification({ message: `Үг нэмэгдлээ. Нийт үгийн тоо: ${data.wordCount}`, type: 'success' })
        console.log('Word saved successfully:', newWord)
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
      await saveWord(currentWord.trim())
      setCurrentWord('')
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatWords(displayFormat)).then(() => {
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
      {notification && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
          <p>{notification.message}</p>
        </div>
      )}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Үг нэмэх</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value)}
              placeholder="Үг оруулна уу"
              disabled={isSaving}
            />
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Нэмж байна...' : 'Үг нэмэх'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <div className="w-full mb-4">
            <p className="text-lg font-semibold text-primary">
              {`Нийт үгс: ${words.length}`}
            </p>
          </div>
          <div className="w-full mb-4">
            <div className="flex space-x-2 mb-2">
              <Button
                variant={displayFormat === 'plain' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayFormat('plain')}
              >
                Энгийн жагсаалт
              </Button>
              <Button
                variant={displayFormat === 'comma' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayFormat('comma')}
              >
                Таслалаар тусгаарлах
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
              onClick={copyToClipboard}
              aria-label="Clipboard-д хуулах"
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
              {formatWords(displayFormat)}
            </pre>
          </div>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Монгол хараалын үгс. Бүх эрх хуулиар хамгаалагдсан.</p>
        <a 
          href="https://www.instagram.com/buyakublai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
        >
          <Instagram className="w-4 h-4 mr-1" />
          @buyakublai
        </a>
      </footer>
    </div>
  )
}