import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateSchedulePDF = async (elementId: string): Promise<void> => {
  const scheduleElement = document.getElementById(elementId);

  if (!scheduleElement) {
    console.error(`Element with ID '${elementId}' not found.`);
    alert(`Could not find the schedule element to download.`);
    return;
  }

  try {
    const canvas = await html2canvas(scheduleElement, {
      scale: 2, 
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10; 

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    pdf.save('schedule.pdf');

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("An error occurred while generating the PDF.");
  } 

};