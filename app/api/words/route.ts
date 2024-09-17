import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

const BLOB_NAME = 'words.json';

async function getLatestWords() {
  console.log('Fetching latest words...');
  const { blobs } = await list();
  const wordBlob = blobs.find(blob => blob.pathname === BLOB_NAME);
  
  if (wordBlob) {
    console.log('Word blob found:', wordBlob);
    const response = await fetch(wordBlob.url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.statusText}`);
    }
    const text = await response.text();
    console.log('Fetched words:', text);
    return JSON.parse(text);
  }
  console.log('No word blob found, returning empty array');
  return [];
}

export async function GET() {
  try {
    const words = await getLatestWords();
    console.log('GET: Retrieved words:', words);
    return NextResponse.json(words);
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: 'Үгсийг авахад алдаа гарлаа' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newWord = await request.json();
    console.log('POST: Received new word:', newWord);
    
    if (typeof newWord !== 'string') {
      return NextResponse.json({ success: false, error: 'Буруу оролт: текст утга шаардлагатай' }, { status: 400 });
    }

    let existingWords = await getLatestWords();
    console.log('POST: Existing words before update:', existingWords);

    if (!existingWords.includes(newWord)) {
      existingWords.push(newWord);
      console.log('POST: Updated words to be saved:', existingWords);

      const { url } = await put(BLOB_NAME, JSON.stringify(existingWords), {
        access: 'public',
        addRandomSuffix: false,
      });
      
      console.log('POST: Words saved successfully. URL:', url);

      // Fetch the words again to ensure we have the latest version
      const updatedWords = await getLatestWords();
      console.log('POST: Fetched updated words after save:', updatedWords);

      return NextResponse.json({ success: true, url, wordCount: updatedWords.length, words: updatedWords });
    } else {
      console.log('POST: Word already exists, not adding');
      return NextResponse.json({ success: false, error: 'Энэ үг аль хэдийн байна' }, { status: 409 });
    }
  } catch (error) {
    console.error('Үгсийг шинэчлэхэд алдаа гарлаа:', error);
    return NextResponse.json({ success: false, error: 'Үгсийг шинэчлэхэд алдаа гарлаа' }, { status: 500 });
  }
}