// Function to update table headers
function popTableHeaders(industries, configTableHead) {
    // Create table headers based on selected columns
    const headersHTML = industries.map(ind => `<th>${ind}</th>`).join('');
    configTableHead.innerHTML = `
        <tr>
            ${headersHTML}
        </tr>
    `;
}

// Function to update table values
async function popTableValues(industries, factors, configTableBody) {
    // Clear the table body
    configTableBody.innerHTML = '';

    // Determine the maximum number of factors in any industry
    const maxFactorsLength = Math.max(...industries.map(industry => factors[industry].length));

    // Iterate over the maximum number of factors to create rows
    for (let i = 0; i < maxFactorsLength; i++) {
        const tr = document.createElement('tr');

        for (const industry of industries) {
            const industryFactors = factors[industry];
            const factor = industryFactors[i] || ''; // Handle cases where some industries have fewer factors

            tr.innerHTML += `
                <td>
                    ${factor ? `<input type="checkbox" class="config-checkbox" data-config="${industry}-${factor}">${factor}` : ''}
                </td>
            `;
        }

        configTableBody.appendChild(tr);
    }
}

// Function to get selected factors on button click
function getSelectedFactors(industries) {
    const selectedFactors = {};
    industries.forEach(industry => {
        selectedFactors[industry] = [];
    });

    const checkboxes = document.querySelectorAll('.config-checkbox:checked');
    checkboxes.forEach(checkbox => {
        const [industry, factor] = checkbox.getAttribute('data-config').split('-');
        selectedFactors[industry].push(factor);
    });

    return selectedFactors;
}

// Example usage:
// Assuming you have elements with IDs 'configTableHead', 'configTableBody', and 'apply-btn'
document.addEventListener('DOMContentLoaded', () => {
    const configTableHead = document.getElementById('config-table').querySelector('thead');
    const configTableBody = document.getElementById('config-table').querySelector('tbody');

    // Populate the table initially
    popTableHeaders(industries, configTableHead);
    popTableValues(industries, factors, configTableBody);

    document.getElementById('apply-btn').addEventListener('click', () => {
        const selectedFactors = getSelectedFactors(industries);
        console.log(selectedFactors); // You can handle this dictionary as needed

        // Store selectedFactors in localStorage
        localStorage.setItem('selectedFactors', JSON.stringify(selectedFactors));
        // Redirect to the app.route('/') page
        window.location.href = '/table';
    });

    // Modal functionality
    const modal = document.getElementById('myModal');
    const modal1 = document.getElementById('myModal1');
    const addBtn = document.getElementById('add');
    const deleteBtn = document.getElementById('remove');
    const closeBtns = document.querySelectorAll('.close');
    const newIndustryBtn = document.getElementById('new-industry-btn');
    const selectIndustryBtn = document.getElementById('select-industry-btn');
    const newIndustryForm = document.getElementById('new-industry-form');
    const selectIndustryForm = document.getElementById('select-industry-form');
    const industrySelect = document.getElementById('industry-select');
    const deleteIndustrySelect = document.getElementById('delete-industry-select');
    const applyNewIndustry = document.getElementById('apply-new-industry');
    const applySelectIndustry = document.getElementById('apply-select-industry');
    const deleteSelectIndustry = document.getElementById('delete-select-industry');
    const csvFileInput = document.getElementById('csv-file');
    const dropArea = document.getElementById('drop-area');

    // Populate industry select options
    industries.forEach(industry => {
        const option = document.createElement('option');
        option.value = industry;
        option.textContent = industry;
        industrySelect.appendChild(option);

        const deleteOption = document.createElement('option');
        deleteOption.value = industry;
        deleteOption.textContent = industry;
        deleteIndustrySelect.appendChild(deleteOption);
    });

    addBtn.onclick = function() {
        modal.style.display = "block";
    }

    deleteBtn.onclick = function() {
        modal1.style.display = "block";
    }

    closeBtns.forEach(btn => {
        btn.onclick = function() {
            modal.style.display = "none";
            modal1.style.display = "none";
            newIndustryForm.style.display = "none";
            selectIndustryForm.style.display = "none";
        }
    });

    window.onclick = function(event) {
        if (event.target == modal || event.target == modal1) {
            modal.style.display = "none";
            modal1.style.display = "none";
            newIndustryForm.style.display = "none";
            selectIndustryForm.style.display = "none";
        }
    }

    newIndustryBtn.onclick = function() {
        newIndustryForm.style.display = "block";
        selectIndustryForm.style.display = "none";
    }

    selectIndustryBtn.onclick = function() {
        selectIndustryForm.style.display = "block";
        newIndustryForm.style.display = "none";
    }

    function handleFiles(files) {
        const industryName = document.getElementById('industry-name').value;
        if (files.length > 0 && industryName) {
            const formData = new FormData();
            formData.append('csvFile', files[0]);
            formData.append('industryName', industryName);
            fetch('/upload-csv', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('CSV file uploaded successfully.');
                } else {
                    alert('Failed to upload CSV file.');
                }
            })
            .catch(error => console.error('Error:', error));
        } else {
            alert('Please enter an industry name and select a CSV file.');
        }
    }

    csvFileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.style.background = '#e9e9e9';
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.style.background = '';
    });

    dropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        dropArea.style.background = '';
        const files = event.dataTransfer.files;
        handleFiles(files);
    });

    applyNewIndustry.onclick = function() {
        const industryName = document.getElementById('industry-name').value;
        const columns = document.getElementById('columns').value.split(',').map(col => col.trim());
        const target_var = document.getElementById('target').value;
        if (industries.includes(industryName)){
            alert("Failed to add industry. " + industryName + " industry already exists.");
        }
        else if (industryName && columns.length) {
            fetch('/update-industries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ new_industry: industryName, columns: columns, inF: columns, target_var: target_var})
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    industries.push(industryName);
                    factors[industryName] = [target_var, ...columns];
                    influencing_factors[industryName] = columns;
                    popTableHeaders(industries, configTableHead);
                    popTableValues(industries, factors, configTableBody);

                    // Add new option to the industry select
                    const option = document.createElement('option');
                    option.value = industryName;
                    option.textContent = industryName;
                    industrySelect.appendChild(option);

                    const deleteOption = document.createElement('option');
                    deleteOption.value = industryName;
                    deleteOption.textContent = industryName;
                    deleteIndustrySelect.appendChild(deleteOption);

                    modal.style.display = "none";
                } else {
                    alert("Failed to add industry.");
                }
            })
            .catch(error => console.error('Error:', error));
        } else {
            alert("Please enter an industry name and at least one column name.");
        }
    };

    applySelectIndustry.onclick = function() {
        const selectedIndustry = industrySelect.value;
        const newColumns = document.getElementById('new-columns').value.split(',').map(col => col.trim());
        const commonColumns = newColumns.filter(col => influencing_factors[selectedIndustry].includes(col));
        const commonColumnNames = commonColumns.join(', ');
        if (commonColumns.length > 0) {
            alert(`Can't add the "${commonColumnNames}" columns, already exist.`);
        }
        else if (selectedIndustry && newColumns.length) {
            // Update client-side factors
            factors[selectedIndustry] = factors[selectedIndustry].concat(newColumns);
            influencing_factors[selectedIndustry] = influencing_factors[selectedIndustry].concat(newColumns);
            // Send the update to the server
            fetch('/update-columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ industry: selectedIndustry, columns: newColumns})
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update the table headers and values
                    popTableHeaders(industries, configTableHead);
                    popTableValues(industries, factors, configTableBody);
    
                    // Close the modal
                    modal.style.display = "none";
                } else {
                    alert("Failed to update columns.");
                }
            })
            .catch(error => console.error('Error:', error));
        } else {
            alert("Please select an industry and enter at least one column name.");
        }
    };

    deleteSelectIndustry.onclick = function() {
        const selectedIndustry = deleteIndustrySelect.value;
        const deleteColumns = document.getElementById('delete-columns').value.split(',').map(col => col.trim());
        if (deleteColumns.length > 0 && deleteColumns[0] !== '') {
            // If columns are specified, delete columns from the industry
            fetch('/delete-columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    industry: selectedIndustry,
                    columns: deleteColumns
                })
            }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Columns deleted successfully!');
                    myModal1.style.display = 'none';
                    location.reload();
                } else {
                    alert('Failed to delete columns.');
                }
            });
        } else {
            // If no columns are specified, delete the entire industry after confirmation
            console.log("entered the else statement");
            var confirmation = confirm(`This will delete the entire ${selectedIndustry} industry data files. Are you sure?`);
            if (confirmation) {
                fetch('/delete-industry', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        industry: selectedIndustry
                    })
                }).then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Industry deleted successfully!');
                        myModal1.style.display = 'none';
                        const indexToRemove = industries.indexOf(selectedIndustry);
                        console.log(industries);
                        if (indexToRemove !== -1) {
                            industries.splice(indexToRemove, 1);
                            console.log(industries);
                        }
                        // factors and influencing_factors are objects (dictionaries)
                        delete factors[selectedIndustry];
                        delete influencing_factors[selectedIndustry];
                        popTableHeaders(industries, configTableHead);
                        popTableValues(industries, factors, configTableBody);
                    } else {
                        alert('Failed to delete industry.');
                    }
                });
            }
        }
    };
});


// On each page (change event)
const icon = document.getElementById('mode-icon');
const body = document.body;

icon.addEventListener('click', function() {
    const isLightMode = body.classList.contains('light-mode');
    const darkmodeValue = isLightMode ? 1 : 0; // so toggle on click.
    icon.src = isLightMode ? 'static/dark-mode.png' : 'static/light-mode.png';
    // Toggle mode
    body.classList.toggle('light-mode');
    body.classList.toggle('dark-mode');
    // Store preference in localStorage
    localStorage.setItem('darkModePreference', darkmodeValue);
});

// On page load
const storedPreference = localStorage.getItem('darkModePreference');
if (storedPreference === '1') {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode'); // Apply dark mode
    icon.src = 'static/dark-mode.png';
} else {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode'); // Apply light mode
    icon.src = 'static/light-mode.png';
}
