const calculateFormEl= document.getElementById('calculateForm');
const resultEl = document.getElementById('result');

const calculateMarks = (event) => {
    event.preventDefault();
    const formData = new FormData(calculateFormEl);
    const data ={};
    formData.forEach((value, key) => {
        data[key] = +value;
    });

    const totalMarks = data.english + data.maths + data.science + data.hindi;
    const percentage = (totalMarks / 400) * 100;
    resultEl.innerText = `Total Marks: ${totalMarks}, Percentage: ${percentage}%`;
}