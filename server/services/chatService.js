const Anthropic = require('@anthropic-ai/sdk');
const { assembleBrandContext } = require('./brandContext');
const { createPresentation } = require('./slidesService');
const { generatePDF } = require('./pdfService');
const BrandTool = require('../models/BrandTool');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TOOLS = [
  {
    name: 'create_presentation',
    description: 'Create a Google Slides presentation. Use this when the user asks for a slide deck, presentation, or pitch deck. You MUST provide the full slide content - title, bullet points, and speaker notes for each slide.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Presentation title' },
        num_slides: { type: 'number', description: 'Number of slides (including title and closing slides)' },
        topic: { type: 'string', description: 'Main topic or purpose of the presentation' },
        audience: { type: 'string', description: 'Target audience' },
        slides: {
          type: 'array',
          description: 'Array of slide objects with content',
          items: {
            type: 'object',
            properties: {
              slide_type: { type: 'string', enum: ['title', 'content', 'section', 'closing'], description: 'Type of slide' },
              title: { type: 'string', description: 'Slide title/heading' },
              bullets: {
                type: 'array',
                items: { type: 'string' },
                description: 'Bullet points for the slide body'
              },
              notes: { type: 'string', description: 'Speaker notes for this slide' }
            },
            required: ['slide_type', 'title']
          }
        }
      },
      required: ['title', 'slides']
    }
  },
  {
    name: 'create_social_content',
    description: 'Create social media post content. Use this when the user asks for a social media post, LinkedIn post, Instagram caption, tweet, or Facebook post.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['linkedin', 'instagram', 'twitter', 'facebook'], description: 'Social media platform' },
        post_text: { type: 'string', description: 'The full post text/caption' },
        headline: { type: 'string', description: 'Suggested headline or hook (for image overlay if using Content Creator)' },
        hashtags: { type: 'array', items: { type: 'string' }, description: 'Relevant hashtags' },
        suggested_dimensions: { type: 'string', description: 'Recommended image dimensions (e.g., "1080x1080" for Instagram)' },
        cta: { type: 'string', description: 'Call to action text' }
      },
      required: ['platform', 'post_text']
    }
  },
  {
    name: 'create_pdf_document',
    description: 'Create a branded PDF document such as a flyer, one-pager, or brochure. Use this when the user asks for print materials, flyers, handouts, or downloadable documents.',
    input_schema: {
      type: 'object',
      properties: {
        document_type: { type: 'string', enum: ['flyer', 'one-pager', 'brochure'], description: 'Type of document' },
        title: { type: 'string', description: 'Document title' },
        subtitle: { type: 'string', description: 'Document subtitle or tagline' },
        sections: {
          type: 'array',
          description: 'Content sections for the document',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string', description: 'Section heading' },
              body: { type: 'string', description: 'Section body text' }
            },
            required: ['heading', 'body']
          }
        },
        cta: { type: 'string', description: 'Call to action text' },
        contact_info: { type: 'string', description: 'Contact information to include' }
      },
      required: ['document_type', 'title', 'sections']
    }
  },
  {
    name: 'reference_tool',
    description: 'Reference an existing brand tool in the hub. Use this when the user could benefit from using one of the interactive brand tools.',
    input_schema: {
      type: 'object',
      properties: {
        tool_slug: { type: 'string', description: 'The slug of the tool to reference' },
        reason: { type: 'string', description: 'Brief explanation of why this tool is relevant' }
      },
      required: ['tool_slug', 'reason']
    }
  }
];

/**
 * Process a chat message with Claude using tool use.
 * Handles the full tool-use loop: send message -> get tool calls -> execute tools -> return final response.
 */
async function processChat(conversationMessages, userGoogleTokens) {
  const brandContext = await assembleBrandContext();

  const systemPrompt = `You are a brand assistant for Caravan. You help team members create on-brand marketing materials and answer questions about brand guidelines.

${brandContext}

## Your Capabilities
- Answer questions about brand colors, voice, messaging, and guidelines directly from the context above.
- Create Google Slides presentations using the create_presentation tool.
- Create social media content using the create_social_content tool.
- Create branded PDF documents (flyers, one-pagers, brochures) using the create_pdf_document tool.
- Reference existing brand tools using the reference_tool tool.

## Guidelines
- Always use the brand colors and voice when creating content.
- For presentations: create complete, detailed slide content. Don't leave placeholders.
- For social posts: match the platform's style and character limits.
- For PDFs: write compelling copy that reflects the brand voice.
- If a user asks for something the brand tools can help with (like creating static content or risograph prints), suggest the relevant tool.
- Be helpful, concise, and on-brand in all responses.
- When creating presentations, ensure the first slide is a title slide and the last is a closing/thank you slide.`;

  // Convert conversation messages to Claude format
  const messages = conversationMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Initial Claude API call
  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    tools: TOOLS,
    messages
  });

  const toolResults = [];
  let assistantContent = '';

  // Handle tool use loop
  while (response.stop_reason === 'tool_use') {
    const assistantMessage = { role: 'assistant', content: response.content };
    const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
    const toolResultBlocks = [];

    for (const toolUse of toolUseBlocks) {
      let result;
      try {
        result = await executeToolCall(toolUse.name, toolUse.input, userGoogleTokens);
        toolResults.push({
          tool: toolUse.name,
          input: toolUse.input,
          result
        });
      } catch (error) {
        console.error(`Tool execution error (${toolUse.name}):`, error);
        result = { error: error.message };
        toolResults.push({
          tool: toolUse.name,
          input: toolUse.input,
          result: { error: error.message }
        });
      }

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      });
    }

    // Continue the conversation with tool results
    messages.push(assistantMessage);
    messages.push({ role: 'user', content: toolResultBlocks });

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOLS,
      messages
    });
  }

  // Extract final text response
  for (const block of response.content) {
    if (block.type === 'text') {
      assistantContent += block.text;
    }
  }

  return {
    content: assistantContent,
    tool_calls: toolResults
  };
}

/**
 * Execute a tool call and return the result.
 */
async function executeToolCall(toolName, input, userGoogleTokens) {
  switch (toolName) {
    case 'create_presentation': {
      if (!userGoogleTokens?.refresh_token) {
        return {
          error: 'google_not_connected',
          message: 'Google account not connected. Please connect your Google account to create presentations.'
        };
      }
      const result = await createPresentation(userGoogleTokens, input);
      return result;
    }

    case 'create_social_content': {
      // Build pre-filled URL for Content Creator
      const params = new URLSearchParams();

      // Platform (auto-sets dimensions in the tool)
      if (input.platform) params.set('platform', input.platform);

      // Visual content params
      if (input.headline) params.set('headline', input.headline);
      if (input.cta) params.set('ctaText', input.cta);

      // Post copy params
      if (input.post_text) params.set('post_text', input.post_text);
      if (input.hashtags && Array.isArray(input.hashtags)) {
        params.set('hashtags', input.hashtags.map(h => h.replace(/^#/, '')).join(','));
      }

      // Fallback dimensions if platform not recognized
      const platformDimensions = {
        instagram: { width: '1080', height: '1080' },
        linkedin: { width: '1200', height: '627' },
        twitter: { width: '1200', height: '675' },
        facebook: { width: '1200', height: '630' }
      };
      const dims = platformDimensions[input.platform] || { width: '1080', height: '1080' };

      const toolLink = `/tools/static-content-creator?${params.toString()}`;

      return {
        success: true,
        platform: input.platform,
        post_text: input.post_text,
        headline: input.headline,
        hashtags: input.hashtags,
        suggested_dimensions: input.suggested_dimensions || `${dims.width}x${dims.height}`,
        cta: input.cta,
        tool_link: toolLink
      };
    }

    case 'create_pdf_document': {
      const result = await generatePDF(input.document_type, input);
      return result;
    }

    case 'reference_tool': {
      const tool = await BrandTool.findOne({ slug: input.tool_slug, is_active: true });
      if (!tool) {
        return { error: 'Tool not found', slug: input.tool_slug };
      }
      return {
        success: true,
        title: tool.title,
        slug: tool.slug,
        description: tool.description,
        link: `/tools/${tool.slug}`,
        reason: input.reason
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

module.exports = { processChat };
