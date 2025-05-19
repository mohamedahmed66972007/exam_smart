import { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export an HTML element to Word document
 * @param element - The HTML element to export
 * @param filename - The name of the Word file (without extension)
 */
export const exportToWord = async (
  element: HTMLElement,
  filename: string = 'الاختبار'
): Promise<void> => {
  try {
    // Create docx document from element content
    const doc = createWordDocFromHTML(element);
    
    // Generate blob and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('فشل تصدير ملف Word: ' + (error as Error).message);
  }
};

/**
 * Create a Word document from HTML content
 * @param element - The HTML element to convert
 * @returns A docx Document instance
 */
const createWordDocFromHTML = (element: HTMLElement): Document => {
  // Extract text content from element, preserving some structure
  const content = extractStructuredContent(element);
  
  // Create document
  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: content,
      },
    ],
  });
};

/**
 * Extract structured content from HTML element for Word document
 * @param element - The HTML element to process
 * @returns Array of docx paragraphs and other elements
 */
const extractStructuredContent = (element: HTMLElement): any[] => {
  // Get all elements with their hierarchy
  const children: any[] = [];
  
  // Process title - find the first heading element
  const titleElement = element.querySelector('h1, h2');
  if (titleElement) {
    children.push(
      new Paragraph({
        text: titleElement.textContent || '',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        bidirectional: true, // For RTL text
      })
    );
  }
  
  // Process description - find the first paragraph after title
  const descElement = element.querySelector('p');
  if (descElement) {
    children.push(
      new Paragraph({
        text: descElement.textContent || '',
        alignment: AlignmentType.CENTER,
        bidirectional: true,
      })
    );
  }
  
  // Add some spacing
  children.push(new Paragraph({}));
  
  // Process exam details - find elements with specific classes or data attributes
  const detailElements = element.querySelectorAll('.flex.justify-center .flex.items-center');
  detailElements.forEach(detail => {
    children.push(
      new Paragraph({
        text: detail.textContent || '',
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
      })
    );
  });
  
  // Add more spacing
  children.push(new Paragraph({}));
  
  // Process student info section
  children.push(
    new Paragraph({
      text: 'اسم الطالب: ...................................',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      border: {
        bottom: {
          color: "auto",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );
  
  children.push(
    new Paragraph({
      text: 'الدرجة: ........ / 50',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      border: {
        bottom: {
          color: "auto",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );
  
  // Add spacing
  children.push(new Paragraph({}));
  
  // Process instructions
  children.push(
    new Paragraph({
      text: 'تعليمات: يرجى الإجابة على جميع الأسئلة.',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
    })
  );
  
  // Add spacing and separator
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      border: {
        bottom: {
          color: "auto",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );
  children.push(new Paragraph({}));
  
  // Process question sections
  const sections = element.querySelectorAll('h2');
  sections.forEach(section => {
    // Add section title
    children.push(
      new Paragraph({
        text: section.textContent || '',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        shading: {
          fill: "F5F5F5",
        },
      })
    );
    
    // Find all questions in this section
    const questionContainer = section.nextElementSibling;
    if (questionContainer) {
      const questions = questionContainer.querySelectorAll('p.mb-2, p.mb-1');
      
      questions.forEach((question, qIndex) => {
        // Add question text
        children.push(
          new Paragraph({
            text: question.textContent || '',
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: {
              before: 200,
              after: 200,
            },
          })
        );
        
        // Find options if any
        const optionsContainer = question.nextElementSibling;
        if (optionsContainer && optionsContainer.classList.contains('grid')) {
          // Multiple choice
          const options = optionsContainer.querySelectorAll('.flex.items-center');
          options.forEach(option => {
            children.push(
              new Paragraph({
                text: option.textContent || '',
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                indent: {
                  right: 720, // 0.5 inch
                },
              })
            );
          });
        } else if (optionsContainer && optionsContainer.classList.contains('flex')) {
          // True/False
          const options = optionsContainer.querySelectorAll('.flex.items-center');
          options.forEach(option => {
            children.push(
              new Paragraph({
                text: option.textContent || '',
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                indent: {
                  right: 720,
                },
              })
            );
          });
        } else {
          // Essay question - add empty space
          children.push(
            new Paragraph({
              text: '',
              border: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
              spacing: {
                before: 200,
                after: 1200, // Add more space for writing
              },
            })
          );
        }
      });
    }
  });
  
  // Add footer
  children.push(new Paragraph({}));
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      text: 'مع تمنياتنا بالتوفيق والنجاح',
      alignment: AlignmentType.CENTER,
      bidirectional: true,
    })
  );
  
  children.push(
    new Paragraph({
      text: `© ${new Date().getFullYear()} منصة الاختبارات الإلكترونية`,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
    })
  );
  
  return children;
};

/**
 * Create a Word document for a complete exam
 * @param exam - The exam data
 * @param questions - The exam questions
 * @param includeAnswers - Whether to include correct answers
 * @returns Promise resolving to a Blob containing the Word document
 */
export const createExamWord = async (
  exam: any,
  questions: any[],
  includeAnswers: boolean = false
): Promise<Blob> => {
  // Group questions by type
  const multipleChoiceQuestions = questions.filter(q => q.type === 'multiple-choice');
  const trueFalseQuestions = questions.filter(q => q.type === 'true-false');
  const essayQuestions = questions.filter(q => q.type === 'essay');
  
  const children: any[] = [];
  
  // Add header
  children.push(
    new Paragraph({
      text: 'منصة الاختبارات الإلكترونية',
      alignment: AlignmentType.CENTER,
      bidirectional: true,
    })
  );
  
  // Add exam title
  children.push(
    new Paragraph({
      text: exam.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
    })
  );
  
  // Add exam description
  if (exam.description) {
    children.push(
      new Paragraph({
        text: exam.description,
        alignment: AlignmentType.CENTER,
        bidirectional: true,
      })
    );
  }
  
  // Add exam details
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `المادة: ${exam.subject || ''}`,
          bidirectional: true,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    })
  );
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `الصف: ${exam.grade || ''}`,
          bidirectional: true,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    })
  );
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `المدة: ${exam.duration} دقيقة`,
          bidirectional: true,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    })
  );
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `التاريخ: ${exam.examDate ? new Date(exam.examDate).toLocaleDateString('ar-EG') : 'غير محدد'}`,
          bidirectional: true,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    })
  );
  
  // Add student info section
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      text: 'اسم الطالب: ...................................',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      border: {
        bottom: {
          color: "auto",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );
  
  children.push(
    new Paragraph({
      text: 'الدرجة: ........ / ' + questions.reduce((sum, q) => sum + q.points, 0),
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      border: {
        bottom: {
          color: "auto",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );
  
  // Add instructions
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      text: 'تعليمات الاختبار:',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
    })
  );
  
  children.push(
    new Paragraph({
      text: '1. اقرأ الأسئلة بعناية قبل الإجابة.',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
    })
  );
  
  children.push(
    new Paragraph({
      text: `2. الوقت المحدد للاختبار هو ${exam.duration} دقيقة.`,
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
    })
  );
  
  children.push(
    new Paragraph({
      text: '3. تأكد من الإجابة على جميع الأسئلة.',
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
    })
  );
  
  // Add separator
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      border: {
        bottom: {
          color: "auto",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );
  children.push(new Paragraph({}));
  
  // Helper function to add questions for a section
  const addQuestionSection = (title: string, sectionQuestions: any[], startIndex: number) => {
    // Add section title
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        shading: {
          fill: "F5F5F5",
        },
      })
    );
    
    // Add questions
    sectionQuestions.forEach((question, index) => {
      const questionNumber = startIndex + index;
      
      // Question text
      children.push(
        new Paragraph({
          text: `${questionNumber}. ${question.content}`,
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: {
            before: 200,
            after: 200,
          },
        })
      );
      
      // Add options
      if (question.type === 'multiple-choice' && question.options) {
        question.options.forEach((option: string, optIndex: number) => {
          const optionLetter = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][optIndex];
          const isCorrect = option === question.correctAnswer;
          
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${optionLetter}) ${option}`,
                  bidirectional: true,
                  bold: includeAnswers && isCorrect,
                  highlight: includeAnswers && isCorrect ? "yellow" : undefined,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              indent: {
                right: 720, // 0.5 inch
              },
            })
          );
        });
      } else if (question.type === 'true-false') {
        // True option
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "صح",
                bidirectional: true,
                bold: includeAnswers && question.correctAnswer === true,
                highlight: includeAnswers && question.correctAnswer === true ? "yellow" : undefined,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            indent: {
              right: 720,
            },
          })
        );
        
        // False option
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "خطأ",
                bidirectional: true,
                bold: includeAnswers && question.correctAnswer === false,
                highlight: includeAnswers && question.correctAnswer === false ? "yellow" : undefined,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            indent: {
              right: 720,
            },
          })
        );
      } else if (question.type === 'essay') {
        // If including answers, show model answer
        if (includeAnswers && question.acceptedAnswers && question.acceptedAnswers.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "الإجابة النموذجية: ",
                  bidirectional: true,
                  bold: true,
                }),
                new TextRun({
                  text: question.acceptedAnswers[0],
                  bidirectional: true,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              shading: {
                fill: "F9F9F9",
              },
            })
          );
        } else {
          // Empty space for answer
          for (let i = 0; i < 5; i++) {
            children.push(
              new Paragraph({
                text: " ",
                border: {
                  bottom: {
                    color: "auto",
                    space: 1,
                    style: BorderStyle.DOTTED,
                    size: 1,
                  },
                },
              })
            );
          }
        }
      }
      
      // Add spacing between questions
      children.push(new Paragraph({}));
    });
  };
  
  // Add each question section if it has questions
  let questionCounter = 1;
  
  if (multipleChoiceQuestions.length > 0) {
    addQuestionSection('السؤال الأول: اختر الإجابة الصحيحة', multipleChoiceQuestions, questionCounter);
    questionCounter += multipleChoiceQuestions.length;
  }
  
  if (trueFalseQuestions.length > 0) {
    addQuestionSection(
      multipleChoiceQuestions.length > 0 ? 'السؤال الثاني: صح أم خطأ' : 'السؤال الأول: صح أم خطأ',
      trueFalseQuestions,
      questionCounter
    );
    questionCounter += trueFalseQuestions.length;
  }
  
  if (essayQuestions.length > 0) {
    let sectionTitle = 'السؤال الأول: أجب عن الأسئلة التالية';
    if (multipleChoiceQuestions.length > 0 || trueFalseQuestions.length > 0) {
      sectionTitle = (
        multipleChoiceQuestions.length > 0 && trueFalseQuestions.length > 0
          ? 'السؤال الثالث: أجب عن الأسئلة التالية'
          : 'السؤال الثاني: أجب عن الأسئلة التالية'
      );
    }
    
    addQuestionSection(sectionTitle, essayQuestions, questionCounter);
  }
  
  // Add footer
  children.push(new Paragraph({}));
  children.push(
    new Paragraph({
      text: 'مع تمنياتنا بالتوفيق والنجاح',
      alignment: AlignmentType.CENTER,
      bidirectional: true,
    })
  );
  
  children.push(
    new Paragraph({
      text: `© ${new Date().getFullYear()} منصة الاختبارات الإلكترونية`,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
    })
  );
  
  // Create document and generate blob
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      },
    ],
  });
  
  return Packer.toBlob(doc);
};

export default exportToWord;
