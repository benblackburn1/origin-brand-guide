const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const pdf = require('pdf-parse');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Convert PDF to images for Claude Vision API
 */
async function pdfToImages(pdfBuffer) {
  try {
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    console.log(`PDF has ${pageCount} pages`);

    // For now, we'll extract text and process a limited number of pages
    // In production, you might want to use a service like pdf2image or similar
    return {
      pageCount,
      message: 'PDF loaded successfully. Will process with text extraction.'
    };
  } catch (error) {
    console.error('Error converting PDF:', error);
    throw new Error('Failed to process PDF');
  }
}

/**
 * Extract brand guidelines from PDF using Claude
 */
async function extractBrandGuidelines(pdfBuffer) {
  try {
    console.log('Starting brand guideline extraction...');

    // Extract text from PDF first
    console.log('Extracting text from PDF...');
    const pdfData = await pdf(pdfBuffer);
    const pdfText = pdfData.text;

    console.log(`Extracted ${pdfText.length} characters from PDF`);

    const prompt = `You are a brand guideline extraction expert. Analyze the provided brand guidelines document and extract the following information in a structured JSON format:

1. **Brand Colors**: Extract all brand colors with their values
   - Name of the color
   - HEX value (if available)
   - RGB values (if available)
   - CMYK values (if available)
   - Pantone code (if available)
   - Usage context (primary, secondary, accent, etc.)

2. **Typography/Fonts**: Extract all font information
   - Font family name
   - Font weights used
   - Usage context (headings, body, special uses)
   - Any specific guidelines about font usage

3. **Brand Voice & Messaging**: Extract brand voice, tone, and messaging guidelines
   - Brand personality traits
   - Tone of voice guidelines
   - Key messaging points
   - Brand values
   - Do's and Don'ts for communication

4. **Brand Applications**: Extract any information about brand applications
   - Logo usage guidelines
   - Templates mentioned
   - Application examples
   - Use cases

Please respond with a valid JSON object in this exact format:
{
  "colors": [
    {
      "name": "Color Name",
      "hex": "#000000",
      "rgb": "0, 0, 0",
      "cmyk": "0, 0, 0, 100",
      "pantone": "Pantone 000 C",
      "category": "primary|secondary|accent"
    }
  ],
  "fonts": [
    {
      "name": "Font Family Name",
      "weights": ["regular", "bold", "light"],
      "usage": "Description of usage"
    }
  ],
  "brandVoice": {
    "personality": ["trait1", "trait2"],
    "tone": "Description of tone",
    "messaging": ["key message 1", "key message 2"],
    "values": ["value 1", "value 2"],
    "guidelines": "General communication guidelines"
  },
  "applications": [
    {
      "type": "Type of application",
      "description": "Description",
      "guidelines": "Specific guidelines"
    }
  ]
}

If you cannot find certain information, use empty arrays [] or empty strings "". Be as thorough as possible in extracting all available information.`;

    // Call Claude API with extracted text
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${prompt}

Here is the brand guidelines document text:

${pdfText}`,
        },
      ],
    });

    console.log('Claude API response received');

    // Extract the text content from Claude's response
    const responseText = message.content[0].text;

    // Parse JSON from response
    // Claude might wrap JSON in markdown code blocks, so we need to handle that
    let jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (!jsonMatch) {
      // Try without markdown
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    console.log('Successfully extracted brand guidelines');

    return extractedData;
  } catch (error) {
    console.error('Error extracting brand guidelines:', error);
    throw error;
  }
}

/**
 * Process uploaded brand guidelines PDF
 */
async function processBrandGuidelinesPDF(filePath) {
  try {
    // Read PDF file
    const pdfBuffer = await fs.readFile(filePath);

    // Extract brand guidelines using Claude
    const extractedData = await extractBrandGuidelines(pdfBuffer);

    return extractedData;
  } catch (error) {
    console.error('Error processing brand guidelines PDF:', error);
    throw error;
  }
}

/**
 * Extract brand guidelines from images using Claude Vision
 */
async function extractBrandGuidelinesFromImages(imageFiles) {
  try {
    console.log(`Starting brand guideline extraction from ${imageFiles.length} images...`);

    const prompt = `You are a brand guideline extraction expert. Analyze the provided brand guidelines screenshots and extract the following information in a structured JSON format:

1. **Brand Colors**: Extract all brand colors with their values
   - Name of the color
   - HEX value (if available or if you can see the color, estimate the hex)
   - RGB values (if available)
   - CMYK values (if available)
   - Pantone code (if available)
   - Usage context (primary, secondary, accent, etc.)

2. **Typography/Fonts**: Extract all font information
   - Font family name
   - Font weights used
   - Usage context (headings, body, special uses)
   - Any specific guidelines about font usage

3. **Brand Voice & Messaging**: Extract brand voice, tone, and messaging guidelines
   - Brand personality traits
   - Tone of voice guidelines
   - Key messaging points
   - Brand values
   - Do's and Don'ts for communication

4. **Brand Applications**: Extract any information about brand applications
   - Logo usage guidelines
   - Templates mentioned
   - Application examples
   - Use cases

Please respond with a valid JSON object in this exact format:
{
  "colors": [
    {
      "name": "Color Name",
      "hex": "#000000",
      "rgb": "0, 0, 0",
      "cmyk": "0, 0, 0, 100",
      "pantone": "Pantone 000 C",
      "category": "primary|secondary|accent"
    }
  ],
  "fonts": [
    {
      "name": "Font Family Name",
      "weights": ["regular", "bold", "light"],
      "usage": "Description of usage"
    }
  ],
  "brandVoice": {
    "personality": ["trait1", "trait2"],
    "tone": "Description of tone",
    "messaging": ["key message 1", "key message 2"],
    "values": ["value 1", "value 2"],
    "guidelines": "General communication guidelines"
  },
  "applications": [
    {
      "type": "Type of application",
      "description": "Description",
      "guidelines": "Specific guidelines"
    }
  ]
}

If you cannot find certain information, use empty arrays [] or empty strings "". Be as thorough as possible in extracting all available information from the images.`;

    // Prepare image content for Claude
    const imageContent = [];

    for (const file of imageFiles) {
      const imageBuffer = await fs.readFile(file.path);
      const base64Image = imageBuffer.toString('base64');

      // Determine media type from file mimetype
      const mediaType = file.mimetype;

      imageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Image,
        },
      });
    }

    // Add text prompt after images
    imageContent.push({
      type: 'text',
      text: prompt,
    });

    // Call Claude API with images
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: imageContent,
        },
      ],
    });

    console.log('Claude API response received');

    // Extract the text content from Claude's response
    const responseText = message.content[0].text;

    // Parse JSON from response
    let jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (!jsonMatch) {
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    console.log('Successfully extracted brand guidelines from images');

    return extractedData;
  } catch (error) {
    console.error('Error extracting brand guidelines from images:', error);
    throw error;
  }
}

module.exports = {
  processBrandGuidelinesPDF,
  extractBrandGuidelines,
  extractBrandGuidelinesFromImages,
};
