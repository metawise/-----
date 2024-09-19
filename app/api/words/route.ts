import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const MAX_WORD_LENGTH = 50; // Maximum allowed length for a single word
const MAX_WORDS_PER_REQUEST = 100; // Maximum number of words allowed in a single request

function isValidWord(word: string): boolean {
  return /^[а-яА-ЯөӨүҮёЁa-zA-Z\s]+$/.test(word) && word.length <= MAX_WORD_LENGTH;
}

function cleanWord(word: string): string {
  // Remove any characters that are not Mongolian Cyrillic, Latin letters, or spaces
  return word.replace(/[^а-яА-ЯөӨүҮёЁa-zA-Z\s]/g, '').trim();
}

async function getWords(): Promise<string[]> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT word FROM words ORDER BY id DESC');
    return result.rows.map(row => row.word);
  } finally {
    client.release();
  }
}

export async function GET() {
  try {
    const words = await getWords();
    return NextResponse.json(words);
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ error: 'Үгсийг авахад алдаа гарлаа' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newWords = await request.json();
    
    if (!Array.isArray(newWords)) {
      return NextResponse.json({ success: false, error: 'Буруу оролт: үгсийн массив шаардлагатай' }, { status: 400 });
    }

    if (newWords.length > MAX_WORDS_PER_REQUEST) {
      return NextResponse.json({ success: false, error: `Хэт олон үг. Нэг удаад дээд тал нь ${MAX_WORDS_PER_REQUEST} үг оруулах боломжтой.` }, { status: 400 });
    }

    const cleanedNewWords = newWords.map(cleanWord).filter(word => word.length > 0);
    const invalidWords = cleanedNewWords.filter(word => !isValidWord(word));
    if (invalidWords.length > 0) {
      return NextResponse.json({ success: false, error: `Буруу оролт: "${invalidWords.join(', ')}" нь зөвхөн үсэг агуулаагүй эсвэл хэт урт байна` }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertPromises = cleanedNewWords.map(word => 
        client.query('INSERT INTO words (word) VALUES ($1) ON CONFLICT (word) DO NOTHING', [word])
      );
      await Promise.all(insertPromises);

      await client.query('COMMIT');

      const updatedWords = await getWords();

      return NextResponse.json({ 
        success: true, 
        wordCount: updatedWords.length, 
        words: updatedWords,
        addedWords: cleanedNewWords,
        addedCount: cleanedNewWords.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Үгсийг шинэчлэхэд алдаа гарлаа:', error);
    return NextResponse.json({ success: false, error: 'Үгсийг шинэчлэхэд алдаа гарлаа' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { words } = await request.json();

    if (!Array.isArray(words)) {
      return NextResponse.json({ success: false, error: 'Буруу оролт: үгсийн массив шаардлагатай' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const deletePromises = words.map(word => 
        client.query('DELETE FROM words WHERE word = $1', [word])
      );
      await Promise.all(deletePromises);

      await client.query('COMMIT');

      const updatedWords = await getWords();

      return NextResponse.json({ 
        success: true, 
        wordCount: updatedWords.length, 
        words: updatedWords,
        deletedCount: words.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Үгсийг устгахад алдаа гарлаа:', error);
    return NextResponse.json({ success: false, error: 'Үгсийг устгахад алдаа гарлаа' }, { status: 500 });
  }
}