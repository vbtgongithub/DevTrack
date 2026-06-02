import { describe, it, expect, vi } from 'vitest';
import { PDFParser } from '../../../modules/resume/parsing/pdf-parser.js';
import { promises as fs } from 'fs';

const mockGetText = vi.fn().mockResolvedValue({ text: 'Parsed Resume Text' });
const mockGetInfo = vi.fn().mockResolvedValue({ total: 2, info: { Title: 'Resume' } });
const mockDestroy = vi.fn().mockResolvedValue(undefined);

vi.mock('pdf-parse', () => {
  class MockPDFParse {
    getText = mockGetText;
    getInfo = mockGetInfo;
    destroy = mockDestroy;
  }
  return {
    PDFParse: MockPDFParse
  };
});

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn().mockResolvedValue(Buffer.from('dummy')),
  },
}));

vi.mock('../../../shared/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('PDFParser', () => {
  it('should parse PDF successfully using modern PDFParse API', async () => {
    const parser = new PDFParser();
    const result = await parser.parse('dummy/path/resume.pdf');

    expect(fs.readFile).toHaveBeenCalledWith('dummy/path/resume.pdf');
    expect(mockGetText).toHaveBeenCalled();
    expect(mockGetInfo).toHaveBeenCalled();
    expect(mockDestroy).toHaveBeenCalled();

    expect(result).toEqual({
      text: 'Parsed Resume Text',
      pages: 2,
      metadata: {
        info: { Title: 'Resume' },
        version: '2.0',
      },
    });
  });

  it('should extract sections correctly', () => {
    const parser = new PDFParser();
    const text = 'John Doe\nSummary\nI am a software engineer.\nExperience\nWorked at TechCorp.';
    const sections = parser.extractSections(text);

    expect(sections.summary).toBe('I am a software engineer.');
    expect(sections.experience).toBe('Worked at TechCorp.');
  });

  it('should extract heading structure correctly', () => {
    const parser = new PDFParser();
    const text = 'John Doe\nSummary\nSome text\nExperience\nSome work';
    const headings = parser.extractHeadings(text);

    expect(headings).toContain('Summary');
    expect(headings).toContain('Experience');
  });

  it('should extract bullets correctly', () => {
    const parser = new PDFParser();
    const text = '• First bullet\n- Second bullet\n1. Numbered bullet\n\tTab bullet';
    const bullets = parser.extractBullets(text);

    expect(bullets[0]).toEqual({ level: 0, text: 'First bullet' });
    expect(bullets[1]).toEqual({ level: 0, text: 'Second bullet' });
    expect(bullets[2]).toEqual({ level: 0, text: 'Numbered bullet' });
  });

  it('should extract links correctly', () => {
    const parser = new PDFParser();
    const text = 'Visit http://google.com or https://github.com/user';
    const links = parser.extractLinks(text);

    expect(links).toContain('http://google.com');
    expect(links).toContain('https://github.com/user');
  });

  it('should extract formatting patterns correctly', () => {
    const parser = new PDFParser();
    const text = 'SUMMARY\n• Bullet\n1. Number\ntest@email.com\n123-456-7890';
    const patterns = parser.extractFormattingPatterns(text);

    expect(patterns.hasUppercaseHeadings).toBe(true);
    expect(patterns.hasBulletPoints).toBe(true);
    expect(patterns.hasNumbering).toBe(true);
    expect(patterns.hasEmail).toBe(true);
  });
});
