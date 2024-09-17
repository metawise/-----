import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

const BLOB_NAME = 'words.json';

async function getLatestWords() {
  const { blobs } = await list();
  const wordBlob = blobs.find(blob => blob.pathname === BLOB_NAME);
  
  if (wordBlob) {
    const response = await fetch(wordBlob.url, { cache: "reload" });
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.statusText}`);
    }
    const text = await response.text();
    return JSON.parse(text);
  }
  return [];
}

export async function GET() {
  try {
    const words = await getLatestWords();
    console.log('Retrieved words:', words);
    return NextResponse.json(words);
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: 'Үгсийг авахад алдаа гарлаа' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newWord = await request.json();
    
    if (typeof newWord !== 'string') {
      return NextResponse.json({ success: false, error: 'Буруу оролт: текст утга шаардлагатай' }, { status: 400 });
    }

    const existingWords = await getLatestWords();

    console.log('Existing words before update:', existingWords);

    if (!existingWords.includes(newWord)) {
      existingWords.push(newWord);

      console.log('Words to be saved:', existingWords);

      const { url } = await put(BLOB_NAME, JSON.stringify(existingWords), {
        access: 'public',
        addRandomSuffix: false,
      });
      
      console.log('Words saved successfully. URL:', url);

      // Fetch the words again to ensure we have the latest version
      const updatedWords = await getLatestWords();

      console.log('Updated words:', updatedWords);
      

      return NextResponse.json({ success: true, url, wordCount: updatedWords.length, words: updatedWords });
    } else {
      return NextResponse.json({ success: false, error: 'Энэ үг аль хэдийн байна' }, { status: 409 });
    }
  } catch (error) {
    console.error('Үгсийг шинэчлэхэд алдаа гарлаа:', error);
    return NextResponse.json({ success: false, error: 'Үгсийг шинэчлэхэд алдаа гарлаа' }, { status: 500 });
  }
}