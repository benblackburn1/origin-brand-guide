const { google } = require('googleapis');
const { getBrandColors, getPrimaryLogoUrl } = require('./brandContext');

/**
 * Creates a Google Slides presentation from structured slide content.
 * Uses the user's OAuth tokens to create the presentation in their Drive.
 */
async function createPresentation(userTokens, slideContent) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: userTokens.access_token,
    refresh_token: userTokens.refresh_token,
    expiry_date: userTokens.expiry_date
  });

  const slides = google.slides({ version: 'v1', auth: oauth2Client });
  const brandColors = await getBrandColors();

  // Create the presentation
  const presentation = await slides.presentations.create({
    requestBody: {
      title: slideContent.title
    }
  });

  const presentationId = presentation.data.presentationId;

  // Build batch update requests for all slides
  const requests = [];

  // Get the default slide ID (first slide created automatically)
  const defaultSlideId = presentation.data.slides[0].objectId;

  // We'll delete the default blank slide after creating our slides
  const slideIds = [];

  for (let i = 0; i < slideContent.slides.length; i++) {
    const slide = slideContent.slides[i];
    const slideId = `slide_${i}`;
    slideIds.push(slideId);

    // Create new slide
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: i,
        slideLayoutReference: {
          predefinedLayout: 'BLANK'
        }
      }
    });

    // Set background color based on slide type
    const bgColor = slide.slide_type === 'title' || slide.slide_type === 'closing'
      ? hexToRgb(brandColors.primary)
      : hexToRgb(brandColors.background);

    requests.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: {
              color: { rgbColor: bgColor }
            }
          }
        },
        fields: 'pageBackgroundFill.solidFill.color'
      }
    });

    // Title text box
    const titleId = `title_${i}`;
    const isHeroSlide = slide.slide_type === 'title' || slide.slide_type === 'closing';
    const titleColor = isHeroSlide ? hexToRgb(brandColors.background) : hexToRgb(brandColors.primary);

    requests.push({
      createShape: {
        objectId: titleId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 8000000, unit: 'EMU' },
            height: { magnitude: isHeroSlide ? 2000000 : 1000000, unit: 'EMU' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 500000,
            translateY: isHeroSlide ? 2000000 : 400000,
            unit: 'EMU'
          }
        }
      }
    });

    requests.push({
      insertText: {
        objectId: titleId,
        text: slide.title
      }
    });

    requests.push({
      updateTextStyle: {
        objectId: titleId,
        style: {
          fontSize: { magnitude: isHeroSlide ? 36 : 28, unit: 'PT' },
          fontFamily: 'Inter',
          bold: true,
          foregroundColor: {
            opaqueColor: { rgbColor: titleColor }
          }
        },
        textRange: { type: 'ALL' },
        fields: 'fontSize,fontFamily,bold,foregroundColor'
      }
    });

    // Body content (bullets)
    if (slide.bullets && slide.bullets.length > 0 && slide.slide_type === 'content') {
      const bodyId = `body_${i}`;
      const bodyText = slide.bullets.map(b => `• ${b}`).join('\n');
      const bodyColor = hexToRgb(brandColors.text);

      requests.push({
        createShape: {
          objectId: bodyId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 8000000, unit: 'EMU' },
              height: { magnitude: 3500000, unit: 'EMU' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 500000,
              translateY: 1600000,
              unit: 'EMU'
            }
          }
        }
      });

      requests.push({
        insertText: {
          objectId: bodyId,
          text: bodyText
        }
      });

      requests.push({
        updateTextStyle: {
          objectId: bodyId,
          style: {
            fontSize: { magnitude: 16, unit: 'PT' },
            fontFamily: 'Inter',
            foregroundColor: {
              opaqueColor: { rgbColor: bodyColor }
            }
          },
          textRange: { type: 'ALL' },
          fields: 'fontSize,fontFamily,foregroundColor'
        }
      });

      // Line spacing
      requests.push({
        updateParagraphStyle: {
          objectId: bodyId,
          style: {
            lineSpacing: 180,
            spaceAbove: { magnitude: 6, unit: 'PT' }
          },
          textRange: { type: 'ALL' },
          fields: 'lineSpacing,spaceAbove'
        }
      });
    }

    // Subtitle for title/closing slides
    if ((slide.slide_type === 'title' || slide.slide_type === 'closing') && slide.bullets && slide.bullets.length > 0) {
      const subId = `subtitle_${i}`;
      const subText = slide.bullets.join('\n');

      requests.push({
        createShape: {
          objectId: subId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 7000000, unit: 'EMU' },
              height: { magnitude: 1500000, unit: 'EMU' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 500000,
              translateY: 3800000,
              unit: 'EMU'
            }
          }
        }
      });

      requests.push({
        insertText: {
          objectId: subId,
          text: subText
        }
      });

      requests.push({
        updateTextStyle: {
          objectId: subId,
          style: {
            fontSize: { magnitude: 18, unit: 'PT' },
            fontFamily: 'Inter',
            foregroundColor: {
              opaqueColor: { rgbColor: hexToRgb(brandColors.accent) }
            }
          },
          textRange: { type: 'ALL' },
          fields: 'fontSize,fontFamily,foregroundColor'
        }
      });
    }

    // Speaker notes
    if (slide.notes) {
      requests.push({
        insertText: {
          objectId: `${slideId}_notes`,
          text: slide.notes
        }
      });
    }
  }

  // Delete the default blank slide
  requests.push({
    deleteObject: {
      objectId: defaultSlideId
    }
  });

  // Execute all requests
  if (requests.length > 0) {
    // Filter out speaker notes requests that might fail (notes page might not exist)
    const safeRequests = requests.filter(r => {
      if (r.insertText?.objectId?.endsWith('_notes')) return false;
      return true;
    });

    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: safeRequests }
    });
  }

  const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  return {
    success: true,
    presentationId,
    url: presentationUrl,
    title: slideContent.title,
    slideCount: slideContent.slides.length
  };
}

/**
 * Convert hex color to Google Slides RGB format (0-1 range).
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { red: 0, green: 0, blue: 0 };
  return {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255
  };
}

module.exports = { createPresentation };
