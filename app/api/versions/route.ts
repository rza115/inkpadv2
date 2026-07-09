/**
 * Chapter Versions API
 */
import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const chapterId = req.nextUrl.searchParams.get('chapter_id');
  if (!chapterId) {
    return NextResponse.json({ error: 'chapter_id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('chapter_versions')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('version_number', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { chapter_id, title, content, word_count, label } = body;

  if (!chapter_id || title === undefined || content === undefined) {
    return NextResponse.json({ error: 'chapter_id, title, content required' }, { status: 400 });
  }

  const supabase = createClient();

  // Get next version number
  const { data: existing } = await supabase
    .from('chapter_versions')
    .select('version_number')
    .eq('chapter_id', chapter_id)
    .order('version_number', { ascending: false })
    .limit(1);

  const version_number = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;

  const { data, error } = await supabase
    .from('chapter_versions')
    .insert([{
      chapter_id,
      version_number,
      title,
      content,
      word_count: word_count || 0,
      label: label || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from('chapter_versions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}