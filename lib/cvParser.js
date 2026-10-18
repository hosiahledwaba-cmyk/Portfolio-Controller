import zlib from 'zlib';

/**
 * Extract text from a buffer (supports DOCX, PDF, and plain text)
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {string}
 */
export function extractTextFromBuffer(buffer, filename = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (ext === 'docx') {
    return extractTextFromDocx(buffer);
  } else if (ext === 'pdf') {
    return extractTextFromPdf(buffer);
  } else {
    // Attempt utf-8 plain text / markdown / rtf string conversion
    const str = buffer.toString('utf-8');
    // If it looks like binary (lots of non-printable chars), fallback to pdf/docx extraction heuristics
    if (buffer.indexOf(Buffer.from('PK\x03\x04')) === 0) {
      return extractTextFromDocx(buffer);
    }
    if (buffer.indexOf(Buffer.from('%PDF-')) === 0) {
      return extractTextFromPdf(buffer);
    }
    return str;
  }
}

/**
 * Extract text from DOCX (PKZip containing word/document.xml)
 */
function extractTextFromDocx(buffer) {
  try {
    let offset = 0;
    while (offset < buffer.length - 30) {
      // Find ZIP local file header signature 0x04034b50 (PK\x03\x04)
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileName = buffer.toString('utf-8', fileNameStart, fileNameStart + fileNameLength);
        const dataStart = fileNameStart + fileNameLength + extraFieldLength;

        if (fileName === 'word/document.xml') {
          const compressedData = buffer.slice(dataStart, dataStart + compressedSize);
          let xmlContent;
          if (compressionMethod === 8) {
            // Deflate
            xmlContent = zlib.inflateRawSync(compressedData).toString('utf-8');
          } else {
            // Stored
            xmlContent = compressedData.toString('utf-8');
          }

          // Extract text inside <w:t> tags
          const textMatches = xmlContent.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi) || [];
          const text = textMatches
            .map(m => m.replace(/<[^>]+>/g, ''))
            .join(' ')
            .replace(/\s+/g, ' ');

          if (text.trim()) return text;
        }

        offset = dataStart + compressedSize;
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.warn('DOCX ZIP parsing warning:', err);
  }

  // Fallback: regex search on raw strings
  return buffer.toString('latin1').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Extract text from PDF streams
 */
function extractTextFromPdf(buffer) {
  const textParts = [];
  const str = buffer.toString('latin1');

  // 1. Try to find flate-decoded streams
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const rawStream = Buffer.from(match[1], 'latin1');
    try {
      const decompressed = zlib.inflateSync(rawStream).toString('utf-8');
      // Extract text in PDF text operators: (text) Tj or [(text)] TJ
      const tjMatches = decompressed.match(/\(([^)]+)\)\s*(?:Tj|'|")/g);
      if (tjMatches) {
        textParts.push(tjMatches.map(m => m.replace(/^[\s(]+|[)\s\w'"]+$/g, '')).join(' '));
      }
    } catch (e) {
      // Stream may not be FlateDecode, continue
    }
  }

  // 2. Scan for uncompressed literal text in PDF
  const literalMatches = str.match(/\(([^)]{2,})\)\s*Tj/g);
  if (literalMatches) {
    textParts.push(literalMatches.map(m => m.replace(/^[\s(]+|[)\s\w]+$/g, '')).join(' '));
  }

  const combined = textParts.join(' ').replace(/\s+/g, ' ').trim();
  if (combined.length > 50) {
    return combined;
  }

  // Fallback: extract printable ASCII sequences
  const ascii = str.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
  return ascii;
}

/**
 * Parse extracted CV text into candidate portfolio fields
 * @param {string} text
 * @returns {Object}
 */
export function parseCvTextToPortfolio(text) {
  const result = {
    name: undefined,
    title: undefined,
    contact: {},
    summary: undefined,
    skills: [],
    education: [],
    experience: [],
  };

  if (!text || typeof text !== 'string') return result;

  // 1. Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.contact.email = emailMatch[0].trim();
  }

  // 2. Phone extraction (international or local format)
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,9}/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 9) {
    result.contact.phone = phoneMatch[0].trim();
  }

  // 3. Location extraction (single line match)
  const locationMatch = text.match(/(?:Johannesburg|Pretoria|Cape Town|Durban|Gauteng|South Africa|Sandton|Midrand)[^\n\r,]*(?:,\s*[A-Za-z\s]+)?/i);
  if (locationMatch) {
    const cleanLoc = locationMatch[0].split(/[\n\r]/)[0].replace(/Professional Summary|Summary|Profile/i, '').trim();
    if (cleanLoc) {
      result.contact.location = cleanLoc;
    }
  }

  // 4. Candidate Name: check header or "Hosiah Ledwaba" or first clean title phrase
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (
      !/curriculum|resume|software|engineer|developer|profile|page|\.com|@|\d/i.test(line) &&
      /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,2}$/.test(line)
    ) {
      result.name = line;
      break;
    }
  }

  // 5. Professional Title: e.g. Software Engineer, Software Engineering Student, Developer
  const titleMatch = text.match(/(?:Software\s+(?:Engineer|Engineering|Developer)|Full[- ]Stack\s+Developer|Web\s+Developer|Frontend\s+Developer|Backend\s+Developer|Systems\s+Architect)/i);
  if (titleMatch) {
    result.title = titleMatch[0].trim();
  }

  // 6. Summary Extraction: text between "Summary" / "Objective" / "Profile" and next major section
  const summaryMatch = text.match(/(?:Professional\s+Summary|Summary|Profile|About\s+Me|Executive\s+Summary)\s*[:\n\-—]?\s*([A-Z][^.\n\r]+(?:\.[^.\n\r]+){1,4}\.)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // 7. Tech Skills Keyword Matching
  const TECH_SKILLS = [
    'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#', '.NET', 'ASP.NET',
    'React', 'Node.js', 'FastAPI', 'Flutter', 'Dart', 'Docker', 'SQL', 'PostgreSQL',
    'MySQL', 'SQL Server', 'MongoDB', 'Git', 'CI/CD', 'REST API', 'GraphQL',
    'HTML5', 'CSS3', 'Tailwind', 'Next.js', 'Linux', 'AWS', 'Vercel', 'Redis'
  ];

  const foundSkills = [];
  for (const skill of TECH_SKILLS) {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s,;:(/])${escaped}(?:[\\s,;:/)]|$)`, 'i');
    if (regex.test(text)) {
      foundSkills.push(skill);
    }
  }
  if (foundSkills.length > 0) {
    result.skills = foundSkills;
  }

  return result;
}
