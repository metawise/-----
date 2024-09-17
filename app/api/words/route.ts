import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function isValidWord(word: string): boolean {
  return /^[а-яА-ЯөӨүҮёЁa-zA-Z\s]+$/.test(word);
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

    const invalidWords = newWords.filter(word => !isValidWord(word));
    if (invalidWords.length > 0) {
      return NextResponse.json({ success: false, error: `Буруу оролт: "${invalidWords.join(', ')}" нь зөвхөн үсэг агуулаагүй байна` }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertPromises = newWords.map(word => 
        client.query('INSERT INTO words (word) VALUES ($1) ON CONFLICT (word) DO NOTHING', [word])
      );
      await Promise.all(insertPromises);

      await client.query('COMMIT');

      const updatedWords = await getWords();

      return NextResponse.json({ 
        success: true, 
        wordCount: updatedWords.length, 
        words: updatedWords,
        addedWords: newWords,
        addedCount: newWords.length
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