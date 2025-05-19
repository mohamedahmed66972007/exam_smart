import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import arabic from '@/lib/arabic-font-base64';

/**
 * Initialize jsPDF with Arabic font support
 * @returns A jsPDF instance with Arabic support
 */
const initPdfWithArabicSupport = (): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Add Arabic font support
  pdf.addFileToVFS('Amiri-Regular.ttf', arabic.font);
  pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  pdf.setFont('Amiri');
  
  return pdf;
};

/**
 * Export an HTML element to PDF
 * @param element - The HTML element to export
 * @param filename - The name of the PDF file (without extension)
 */
export const exportToPDF = async (
  element: HTMLElement,
  filename: string = 'الاختبار'
): Promise<void> => {
  try {
    // First, we'll create a canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      allowTaint: false,
    });
    
    // Get the image data
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate the PDF dimensions based on the aspect ratio
    const imgWidth = 210; // A4 width in mm (210mm)
    const pageHeight = 297; // A4 height in mm (297mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = initPdfWithArabicSupport();
    
    // For multi-page support
    let position = 0;
    let heightLeft = imgHeight;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed for large content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('فشل تصدير ملف PDF: ' + (error as Error).message);
  }
};

/**
 * Create a PDF version of an exam for printing
 * @param exam - The exam data
 * @param questions - The exam questions
 * @param options - Additional options
 * @returns A jsPDF instance with the exam
 */
export const createExamPDF = async (
  exam: any,
  questions: any[],
  options: {
    includeAnswers?: boolean;
    includeHeader?: boolean;
    schoolName?: string;
    schoolLogo?: string;
  } = {}
): Promise<jsPDF> => {
  const pdf = initPdfWithArabicSupport();
  
  // Default options
  const {
    includeAnswers = false,
    includeHeader = true,
    schoolName = 'منصة الاختبارات الإلكترونية',
    schoolLogo = ''
  } = options;
  
  // Helper function to add right-to-left text
  const addRTLText = (text: string, x: number, y: number, options: any = {}) => {
    pdf.text(text, x, y, {
      align: 'right',
      ...options
    });
  };
  
  // Add header with logo if available
  if (includeHeader) {
    if (schoolLogo) {
      try {
        pdf.addImage(schoolLogo, 'JPEG', 85, 10, 40, 40);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
      addRTLText(schoolName, 200, 60);
    } else {
      addRTLText(schoolName, 200, 20);
    }
    
    // Add exam title and information
    pdf.setFontSize(18);
    addRTLText(exam.title, 200, schoolLogo ? 70 : 30);
    
    pdf.setFontSize(12);
    addRTLText(exam.description || '', 200, schoolLogo ? 80 : 40);
    
    // Add exam details
    pdf.setFontSize(10);
    const examDetails = [
      `المادة: ${exam.subject || ''}`,
      `الصف: ${exam.grade || ''}`,
      `المدة: ${exam.duration} دقيقة`,
      `التاريخ: ${exam.examDate ? new Date(exam.examDate).toLocaleDateString('ar-EG') : 'غير محدد'}`
    ];
    
    let yPos = schoolLogo ? 90 : 50;
    examDetails.forEach(detail => {
      addRTLText(detail, 200, yPos);
      yPos += 7;
    });
    
    // Add student info fields
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPos, 180, 15);
    addRTLText('اسم الطالب: ................................', 180, yPos + 10);
    
    yPos += 25;
    pdf.rect(15, yPos, 180, 15);
    addRTLText('الدرجة: ............. / ' + questions.reduce((sum, q) => sum + q.points, 0), 180, yPos + 10);
    
    yPos += 25;
    addRTLText('تعليمات الاختبار:', 200, yPos);
    yPos += 7;
    addRTLText('1. اقرأ الأسئلة بعناية قبل الإجابة.', 200, yPos);
    yPos += 7;
    addRTLText('2. الوقت المحدد للاختبار هو ' + exam.duration + ' دقيقة.', 200, yPos);
    yPos += 7;
    addRTLText('3. تأكد من الإجابة على جميع الأسئلة.', 200, yPos);
    
    // Add separator line
    yPos += 15;
    pdf.line(15, yPos, 195, yPos);
    yPos += 15;
  } else {
    // Start directly with questions if no header
    var yPos = 20;
  }
  
  // Group questions by type
  const multipleChoiceQuestions = questions.filter(q => q.type === 'multiple-choice');
  const trueFalseQuestions = questions.filter(q => q.type === 'true-false');
  const essayQuestions = questions.filter(q => q.type === 'essay');
  
  // Function to add a section of questions
  const addQuestionSection = (title: string, questionsGroup: any[], startNumber: number) => {
    // Add section title
    pdf.setFontSize(14);
    addRTLText(title, 200, yPos);
    yPos += 10;
    
    // Add questions
    pdf.setFontSize(11);
    questionsGroup.forEach((question, index) => {
      const questionNumber = startNumber + index;
      
      if (yPos > 270) {
        // Add a new page if we're near the bottom
        pdf.addPage();
        yPos = 20;
      }
      
      // Question text
      addRTLText(`${questionNumber}. ${question.content}`, 200, yPos);
      yPos += 10;
      
      // Add options for multiple choice or true/false
      if (question.type === 'multiple-choice' && question.options) {
        question.options.forEach((option: string, optIndex: number) => {
          const optionLetter = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][optIndex];
          const isCorrect = option === question.correctAnswer;
          
          // Draw circle
          pdf.circle(185, yPos - 3, 2, 'S');
          
          // Fill circle if this is the correct answer and we're including answers
          if (includeAnswers && isCorrect) {
            pdf.circle(185, yPos - 3, 1, 'F');
          }
          
          addRTLText(`${optionLetter}) ${option}`, 180, yPos);
          yPos += 7;
        });
      } else if (question.type === 'true-false') {
        // True option
        pdf.rect(185, yPos - 5, 4, 4, 'S');
        if (includeAnswers && question.correctAnswer === true) {
          pdf.rect(186, yPos - 4, 2, 2, 'F');
        }
        addRTLText('صح', 180, yPos);
        yPos += 7;
        
        // False option
        pdf.rect(185, yPos - 5, 4, 4, 'S');
        if (includeAnswers && question.correctAnswer === false) {
          pdf.rect(186, yPos - 4, 2, 2, 'F');
        }
        addRTLText('خطأ', 180, yPos);
        yPos += 7;
      } else if (question.type === 'essay') {
        // Draw answer box for essay questions
        pdf.rect(15, yPos, 180, 30, 'S');
        
        // If including answers, add the first accepted answer
        if (includeAnswers && question.acceptedAnswers && question.acceptedAnswers.length > 0) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          addRTLText('الإجابة النموذجية: ' + question.acceptedAnswers[0], 180, yPos + 5);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(11);
        }
        
        yPos += 35;
      }
      
      yPos += 5;
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
  pdf.setFontSize(10);
  addRTLText('مع تمنياتنا بالتوفيق والنجاح', 105, 285, { align: 'center' });
  pdf.setFontSize(8);
  addRTLText(`© ${new Date().getFullYear()} منصة الاختبارات الإلكترونية`, 105, 290, { align: 'center' });
  
  return pdf;
};

export default exportToPDF;
