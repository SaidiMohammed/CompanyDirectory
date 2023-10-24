document.addEventListener("DOMContentLoaded", function () {
  if (typeof Chart === "undefined") {
    console.error("ChartJS is not imported. Please make sure it is available.");
  }
  showLoader("container");
  populateTable();
  populateAllDepartments();
  fetchAllLocations();

  // Function to populate the table with data from the API
  function populateTable() {
    $.ajax({
      url: "http://localhost:80/project2/API.php", // Replace with the correct URL
      type: "GET",
      data: { action: "getAll" },
      dataType: "json",
      success: function (data) {
        if (data) {
          let tableBody = $("#ptbody");
          tableBody.empty();

          $.each(data.data, function (index, person) {
            let row = $("<tr>");
            row.attr("value", person.id);
            row.attr("id", "row");
            row.append(
              $("<td>")
                .text(person.lastName + ", " + person.firstName)
                .attr("id", "fullName")
            );
            row.append($("<td>").text(person.department));
            row.append($("<td>").text(person.location));
            row.append($("<td>").text(person.email));
            let buttonsCell = $("<td>");
            buttonsCell.append(
              '<button type="button" id="profileBtn" class="btn fa-solid fa-user fa-xl" data-bs-toggle="modal" data-bs-target="#employeeModal" data-id="' +
                person.id +
                '"></button>'
            );
            buttonsCell.append(
              '<button type="button" id="editEBtn" class="btn fa-solid fa-edit fa-xl" data-bs-toggle="modal" data-bs-target="#editEmployeeModal" data-id="' +
                person.id +
                '"></button>'
            );
            buttonsCell.append(
              '<button type="button" id="deleteBtn" class="btn fa-solid fa-trash fa-xl" data-bs-toggle="modal" data-bs-target="#deleteEmployeeModal" data-id="' +
                person.id +
                '"></button>'
            );
            row.append(buttonsCell);
            generateCharts(data);
            // Add the row to the table
            tableBody.append(row);
          });
        } else {
          console.log("Failed to fetch data from the API.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  function updateEmployee(
    id,
    firstName,
    lastName,
    email,
    jobTitle,
    departmentID
  ) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "updateEmployee",
        id: id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        jobTitle: jobTitle,
        departmentID: departmentID,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          // Update was successful, you can perform any necessary actions here.
        } else {
          console.log("Failed to update Employee.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  $("#editEmployeeForm").submit(function (event) {
    event.preventDefault();

    let id = $("#editEmployeeEmployeeID").val();
    let firstName = $("#editEmployeeFirstName").val();
    let lastName = $("#editEmployeeLastName").val();
    let email = $("#editEmployeeEmailAddress").val();
    let jobTitle = $("#editEmployeeJobTitle").val();
    let departmentID = $("#editEmployeeDepartment").val();

    updateEmployee(id, firstName, lastName, email, jobTitle, departmentID);
  });

  // Function to fetch and populate employee data in the edit form
  function fetchAndPopulateEmployeeData(id) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "GET",
      data: {
        action: "getEmployeeByID",
        id: id,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          // Data retrieval was successful
          const employeeData = data.data[0];

          // Populate the form fields with the retrieved data
          $("#editEmployeeID").val(employeeData.id);
          $("#editEmployeeFirstName").val(employeeData.firstName);
          $("#editEmployeeLastName").val(employeeData.lastName);
          $("#editEmployeeEmailAddress").val(employeeData.email);
          $("#editEmployeeJobTitle").val(employeeData.jobTitle);

          $("#employeeID").val(employeeData.id);
          $("#employeeFirstName").val(employeeData.firstName);
          $("#employeeLastName").val(employeeData.lastName);
          $("#employeeEmailAddress").val(employeeData.email);
          $("#employeeDepartment").val(employeeData.department);

          if(employeeData.jobTitle === "") {
            $("#employeeJobTitle").val("None");
          }

        } else {
          console.log("Failed to fetch Employee data.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  function updateDepartmentByID(departmentName, departmentID, locationID) {
    $.ajax({
      type: "POST",
      url: "API.php",
      data: {
        action: "updateDepartmentByID",
        id: departmentID,
        location: locationID,
        name: departmentName,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          $("#editDepartmentModal").modal("hide");
          alert("Department updated successfully!");
          populateAllDepartments();
        } else {
          alert("Failed to update department!");
          populateAllDepartments();
        }
      },
    });
  }

  $(document).on("click", "#editDBtn", function () {
    const departmentId = $(this).data("id");
    $("#editDepartmentModal").data("departmentId", departmentId);

    // Get the department name from the selected row
    const departmentName = $(this).closest("tr").find("td:first").text();

    // Get the department location from the selected row
    const departmentLocation = $(this)
      .closest("tr")
      .find("td:first")
      .next()
      .text();

    // Set the editDepartment input value to the department name
    $("#editDepartment").val(departmentName);

    // Set the selected option in the editLocation dropdown to the department location
    $("#editLocation option").each(function () {
      if ($(this).text() == departmentLocation) {
        $(this).prop("selected", true);
      } else {
        $(this).prop("selected", false);
      }
    });
  });

  // Add a click event listener to the "Edit" button to populate the form with the selected employee's data
  $(document).on("click", "#editEBtn", function () {
    let id = $(this).data("id");
    fetchAndPopulateEmployeeData(id);
  });

  $(document).on("click", "#profileBtn", function () {
    let id = $(this).data("id");
    fetchAndPopulateEmployeeData(id);
  });

  $("#editDepartmentForm").submit(function (event) {
    event.preventDefault();

    const departmentID = $("#editDepartmentModal").data("departmentId");
    const locationID = $("#editLocation option:selected").val();
    const departmentName = $("#editDepartment").val();

    updateDepartmentByID(departmentName, departmentID, locationID);
  });

  // Function to delete Employee by ID
  function deleteEmployeeByID(id) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "deleteEmployeeByID",
        id: id,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          populateTable();
        } else {
          console.log("Failed to delete Employee.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  // Function to delete Employee by ID
  function deleteDepartmentByID(id) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "deleteDepartmentByID",
        id: id,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          populateAllDepartments();
        } else {
          console.log("Failed to delete Department.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  // Function to check if the department is linked to any employees
  function isDepartmentLinked(id, callback) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "isDepartmentLinked",
        id: id,
      },
      dataType: "json",
      success: callback,
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  // Add a click event listener to the "Delete" button in the delete modal
  $(document).on("click", "#deleteBtn", function () {
    let id = $(this).data("id");
    let tbodyId = $(this).closest("tbody").attr("id"); // Get the ID of the closest tbody

    // Display the modal
    $("#deleteEmployeeModal").modal("show");

    if (tbodyId === "ptbody") {
      let employeeName = $(this).closest("tr").find("td:first").text();
      $("#deleteMsg").text(`Are you sure you want to delete ${employeeName} ?`);
    } else if (tbodyId === "dtbody") {
      // Check if the department is linked to any employees
      isDepartmentLinked(id, function (data) {
        if (data.status.code === "409") {
          // Department is linked to employees
          $("#deleteMsg").text(
            "This department is already assigned to one or more employees"
          );
          $("#deleteEmployeeModal .btn-danger").hide(); // Hide the delete button
        } else {
          // Delete the department
          let departmentName = data.data.departmentName;
          $("#deleteMsg").text(
            `Are you sure you want to delete the department "${departmentName}" ?`
          );
          $("#deleteEmployeeModal .btn-danger").show(); // Show the delete button
        }
      });
    }

    $("#deleteEmployeeModal .btn-danger")
      .off("click")
      .on("click", function () {
        if (tbodyId === "ptbody") {
          deleteEmployeeByID(id); // Call the delete function for Employee table
        } else if (tbodyId === "dtbody") {
          deleteDepartmentByID(id); // Call the delete function for department table
        }
        $("#deleteEmployeeModal").modal("hide");
      });
  });

  // Function to create Employee
  function createEmployee(firstName, lastName, email, jobTitle, departmentID) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "createEmployee",
        firstName: firstName,
        lastName: lastName,
        email: email,
        jobTitle: jobTitle,
        departmentID: departmentID,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          $("#addEmployeeModal").modal("hide");
          populateTable();
        } else {
          console.log("Failed to create Employee.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  // Function to create Department
  function createDepartment(name, location) {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "insertDepartmentByID",
        name: name,
        location: location,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          $("#addDepartmentModal").modal("hide");
          populateAllDepartments();
        } else {
          console.log("Failed to create Department.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  // Add a click event listener to the "Add" button in the add modal
  document.getElementById("addBtn").addEventListener("click", function () {
    // Check which tab is active
    if ($("#employee-tab").hasClass("active")) {
      try {
        // Employee tab is active, show the add Employee modal
        $("#addEmployeeModal").modal("show");
        $("#addEmployeeModal .btn-primary")
          .off("click")
          .on("click", function () {
            // Fetch values from the form
            let firstName = $("#addEmployeeFirstName").val();
            let lastName = $("#addEmployeeLastName").val();
            let email = $("#addEmployeeEmailAddress").val();
            let jobTitle = $("#addEmployeeJobTitle").val();
            let departmentID = $("#addEmployeeDepartment").val();
            // Call the createEmployee function
            createEmployee(firstName, lastName, email, jobTitle, departmentID);
          });
      } catch (error) {
        // Handle any potential error here
        console.error("An error occurred while opening the modal:", error);
      }
    } else if ($("#departments-tab").hasClass("active")) {
      try {
        // Department tab is active, show the add department modal
        $("#addDepartmentModal").modal("show");
        $("#addDepartmentModal .btn-primary")
          .off("click")
          .on("click", function () {
            // Fetch values from the form
            let departmentName = $("#addDepartmentName").val();
            let location = $("#addLocationName option:selected").val();
            // Call the createDepartment function
            createDepartment(departmentName, location);
          });
      } catch (error) {
        // Handle any potential error here
        console.error("An error occurred while opening the modal:", error);
      }
    } else if ($("#locations-tab").hasClass("active")) {
      $("#addLocationModal").modal("show");
      $("#addLocationModal .btn-primary").off("click")
      .on("click", function () {
        let selectedcity = $("#citySelected option:selected").val();

    // Use AJAX to add the selected city to the location table
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "POST",
      data: {
        action: "addLocation",
        locationName: selectedcity,
      },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          $("#addLocationModal").modal("hide");
          myMap.invalidateSize();
        } else {
          console.log("Failed to add location.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
      });
    }

  });

  // Function to populate the dropdown based on active tab
  function populateDropdownBasedOnActiveTab() {
    if ($("#employee-tab").hasClass("active")) {
      populateAllDepartments(); // This function will now handle populating the dropdown for Employee tab
    } else if ($("#departments-tab").hasClass("active")) {
      fetchAllLocations();
    }
  }

  function populateAllDepartments() {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "GET", // Change this to GET, as it's a retrieval operation
      data: { action: "getAllDepartments" },
      dataType: "json",
      success: function (data) {
        let dropdown = $("#departmentDropdown");

        if (data.status.code === "200") {
          let allDepartments = data.data;

          // You can also populate the Departments select field based on the data
          const editEmployeeDepartmentSelect = $("#editEmployeeDepartment");
          editEmployeeDepartmentSelect.empty();
          const addEmployeeDepartmentSelect = $("#addEmployeeDepartment");
          addEmployeeDepartmentSelect.empty();

          let tableBody = $("#dtbody");
          tableBody.empty();

          $.each(allDepartments, function (index, department) {
            let row = $("<tr>");
            row.attr("value", department.id);
            row.attr("id", "row");
            row.append($("<td>").text(department.name));
            row.append($("<td>").text(department.locationName));

            let buttonsCell = $("<td>");
            buttonsCell.append(
              '<button type="button" id="editDBtn" class="btn fa-solid fa-edit fa-xl" data-bs-toggle="modal" data-bs-target="#editDepartmentModal" data-id="' +
                department.id +
                '"></button>'
            );
            buttonsCell.append(
              '<button type="button" id="deleteBtn" class="btn fa-solid fa-trash fa-xl" data-bs-toggle="modal" data-bs-target="#deleteEmployeeModal" data-id="' +
                department.id +
                '"></button>'
            );
            row.append(buttonsCell);

            // Add the row to the table
            tableBody.append(row);

            editEmployeeDepartmentSelect.append(
              $("<option>", {
                value: department.id,
                text: department.name,
              })
            );

            addEmployeeDepartmentSelect.append(
              $("<option>", {
                value: department.id,
                text: department.name,
              })
            );

            if ($("#employee-tab").hasClass("active")) {
              createDepartmentDropdown(allDepartments);
            } else {
              dropdown.empty();
            }
          });
        } else {
          console.log("Failed to fetch department data.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  // Add event listeners to the tabs to update the dropdown when a tab is clicked
  $("#employee-tab").on("click", populateDropdownBasedOnActiveTab);
  $("#departments-tab").on("click", populateDropdownBasedOnActiveTab);

  $("#refreshBtn").click(function () {
    switch (true) {
      case $("#employee-tab").hasClass("active"):
        showLoader("table-container");
        populateTable();
        break;

      case $("#departments-tab").hasClass("active"):
        showLoader("table-container");
        populateAllDepartments();
        break;

      case $("#locations-tab").hasClass("active"):
        showLoader("map");
        reInitializeMap()
        break;

      case $("#chart-tab").hasClass("active"):
        showLoader("departmentChart");
        showLoader("locationChart");
        populateTable();
        break;
    }
  });

  let uniqueLocations = [];

  function fetchAllLocations() {
    $.ajax({
      url: "http://localhost:80/project2/API.php",
      type: "GET",
      data: { action: "getAllLocations" },
      dataType: "json",
      success: function (data) {
        const addLocationName = $("#addLocationName");
        addLocationName.empty();
        const editLocations = $("#editLocation");
        editLocations.empty();
        const dropdown = $("#departmentDropdown");

        uniqueLocations = Array.from(
          new Set(data.data.map((d) => d.name))
        ).map((name) => {
          return data.data.find((d) => d.name === name);
        });

        if (data.status.code === "200") {

          if ($("#departments-tab").hasClass("active")) {
            dropdown.empty();
          $.each(data.data, function (index, location) {
            dropdown.append($("<a href='#'>").text(location.name));
          });
          } else {
            populateAllDepartments();
          }

          $.each(uniqueLocations, function (index, location) {
            searchLocation(location.name, location.id);

            addLocationName.append(
              $("<option>").val(location.id).text(location.name)
            );
            editLocations.append(
              $("<option>").val(location.id).text(location.name)
            );
          });
        } else {
          console.log("Failed to fetch location data.");
        }
      },
      error: function () {
        console.log("AJAX request failed.");
      },
    });
  }

  function showLoader(parentContainerId) {
    // Query all elements with the specified ID
    const parentContainers = document.querySelectorAll(
      `[id='${parentContainerId}']`
    );

    parentContainers.forEach((parentContainer) => {
      // Create pre-loader div
      const preLoader = document.createElement("div");
      preLoader.className = "pre-loader";

      // Create spinner div
      const spinner = document.createElement("div");
      spinner.className = "spinner";

      // Append the spinner to the pre-loader
      preLoader.appendChild(spinner);

      // Append the pre-loader to each parent container with the specified ID
      parentContainer.appendChild(preLoader);

      setTimeout(() => {
        hideLoader(); // Make sure hideLoader function also removes pre-loaders from all specified containers
      }, 1000);
    });
  }

  // Function to hide the pre-loader
  function hideLoader() {
    const loader = document.querySelector(".pre-loader");
    if (loader) {
      loader.remove();
    }
  }

  function searchLocation(locationName, locationID) {
    $.ajax({
      url: "./search.php",
      method: "GET",
      data: { q: locationName },
      success: function (data) {
        if (data.status.code === "200" && data.data.totalResultsCount > 0) {
          const results = data.data.geonames[0];
          let latitude = results.lat;
          let longitude = results.lng;
          let coordinates = [latitude, longitude];
          addLocationsToMap(coordinates, locationName, locationID);
        } else {
          console.error(
            "Failed to get coordinates for:",
            locationName,
            "Data received:",
            data
          );
        }
      },
      error: function (err) {
        console.error(
          "An error occurred while fetching coordinates for",
          locationName,
          err
        );
      },
    });
  }

  // Initialize the Leaflet map

  let night = L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }
  );

  let light = L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }
  );

  let satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  let myMap = L.map("map", {
    layers: [night],
    maxBounds: [
      [-85.06, -180],
      [85.06, 180],
    ],
    minZoom: 0,
    maxZoom: 10,
  }).setView([51.505, -0.09], 4);

  // Add basemap control
  let basemaps = {
    "Night Mode": night,
    "Light Mode": light,
    Satellite: satellite,
  };

  L.control.layers(basemaps).addTo(myMap);

  // Event listener for Add Location modal
  $("#citySearch").on("input", function() {
      let query = $(this).val().trim();
      if(query.length > 2) { 
          fetchCities(query, "add");
      }
  });

  // Event listener for Edit Location modal
  $("#editCitySearch").on("input", function() {
      let query = $(this).val().trim();
      if(query.length > 2) { 
          fetchCities(query, "edit");
      }
  });

  function fetchCities(query, mode) {
    $.ajax({
        url: 'search.php',
        method: 'GET',
        data: { q: query },
        dataType: 'json',
        success: function(response) {
            if(response.status.code === "200" && response.data) {
                populateDropdown(response.data.geonames, mode);
            }
        },
        error: function(error) {
            console.error("Error fetching cities:", error);
        }
    });
  }

  function populateDropdown(cities, mode) {
    let dropdown;
    if (mode === "add") {
        dropdown = $("#citySelected");
    } else if (mode === "edit") {
        dropdown = $("#editLocationName");
    }
    dropdown.empty();
    cities.forEach(city => {
        let option = $("<option>").val(city.name).text(city.name + ", " + city.countryName);
        dropdown.append(option);
    });
  }

  // Create a set to keep track of added markers
  let addedMarkers = new Set();

  function addLocationsToMap(locations, name, locationID) {
    let latitude = parseFloat(locations[0]);
    let longitude = parseFloat(locations[1]);

    // Create a unique identifier for the marker
    let markerId = `${latitude},${longitude}`;

    // Check if the marker is already added to the map
    if (!addedMarkers.has(markerId)) {
      let deleteButton = `<button type="button" id="deleteLBtn" class="btn fa-solid fa-trash" data-bs-toggle="modal" data-bs-target="#deleteLocationModal" data-id="${name}"></button>`;
      let editButton = `<button type="button" id="editLBtn" class="btn fa-solid fa-edit" data-bs-toggle="modal" data-bs-target="#editLocationModal" data-id="${name}"></button>`;

      let popupContent = `
            <div>
                <h5 id="titlePopup">${name}<h5/>
                <div>
                    ${deleteButton}
                    ${editButton}
                </div>
            </div>
        `;

      let markers = L.marker([latitude, longitude]).bindPopup(popupContent);

      markers.on("popupopen", function () {
        // Re-attach the click events when the popup is opened
        let popupElement = this.getPopup().getElement();

        let deleteElement = popupElement.querySelector("#deleteLBtn");
        deleteElement.addEventListener("click", function() {
            deleteLocation(name, locationID)
        });

        let editElement = popupElement.querySelector("#editLBtn");
        editElement.addEventListener("click", function () {
          $("#editLocationModal").modal("show");          
        });

        $("#editLocationForm").submit(function(e) {
          e.preventDefault();

          let matchedLocation = uniqueLocations.find(loc => loc.name === name);
          if (matchedLocation) {
              // Use the id from the matched location
              let locationID = matchedLocation.id;
              let locationName = $("#editLocationName option:selected").val();
              editLocation(locationName, locationID);
          } else {
              console.log("No matching city found in uniqueLocations.");
          }
      });

      });

      markers.addTo(myMap);

      // Add the marker's identifier to the set
      addedMarkers.add(markers);
    }
  }

  function reInitializeMap() {
    // Remove all the markers from the map
    addedMarkers.forEach((marker) => {
        myMap.removeLayer(marker);
    });
    addedMarkers.clear(); // Clear the set of added markers

    // Re-fetch all locations and add them to the map
    fetchAllLocations();
}


  function deleteLocation(locationName, locationID) {
    $.ajax({
      url: "API.php",
      method: "GET",
      dataType: "json",
      data: {
        action: "checkLocationInDepartment",
        locationID: locationID,
      },
      success: function (response) {
        if (response.data.isInDepartment) {
          $("#deleteLMsg").text("The selected location is already linked to a department.");
          $("#deleteLModalSubmitBtn").hide();
        } else {
          $("#deleteLMsg").text(`Are you sure you want to delete ${locationName}?`);
          $("#deleteLModalSubmitBtn").show().off().on("click", function () {
              deleteLocationByID(locationID);
              reInitializeMap();
            });
        }
        $("#deleteLocationModal").modal("hide");
      },
      error: function () {
        alert("An error occurred. Please try again.");
      },
    });
  }

  function deleteLocationByID(locationID) {
    $.ajax({
      url: "API.php",
      method: "GET",
      dataType: "json",
      data: {
        action: "deleteLocationByID",
        locationID: locationID,
      },
      success: function (response) {
        if (response.status.code === "200") {
          $("#deleteModal").modal("hide");
          alert("Location deleted successfully!");
          reInitializeMap(); 
          myMap.invalidateSize();
        } else {
          alert("Error deleting location. Please try again.");
        }
      },
      error: function () {
        alert("An error occurred. Please try again.");
      },
    });
  }

  function editLocation(locationName, locationID) {
      
    $.ajax({
      url: "API.php",
      type: "POST",
      data: {
        action: "editLocationByID",
        locationID: locationID,
        locationName: locationName,
      },
      dataType: "json",
      success: function (response) {
        if (response.status.code == "200") {
          alert("Location name updated successfully!");
          $("#editLocationModal").modal("hide");
          reInitializeMap();
        } else {
          alert("Failed to update location name.");
        }
      },
      error: function (err) {
        alert("Error: " + err.statusText);
      },
    });
  }

  const target = document.getElementById("locations");

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 3. Check if the 'class' attribute has been modified and if the element has the 'active' class
      if (
        mutation.attributeName === "class" &&
        target.classList.contains("active")
      ) {
        myMap.invalidateSize();
      }
    });
  });

  observer.observe(target, {
    attributes: true, // Listen for attribute changes
    attributeFilter: ["class"], // Specifically, for changes in the 'class' attribute
  });

  $("#searchInput").on("keyup", function () {
    let value = $(this).val().toLowerCase();
    $("#ptbody tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });

  // 1. Toggling the dropdown visibility on button click
  $("#filterBtn").on("mouseover", function () {
    $("#departmentDropdown").toggle("on"); // Assuming the dropdown has the id 'departmentDropdown'
  });

  $("#departmentDropdown").on("mouseleave", function () {
    $("#departmentDropdown").toggle("on"); // Assuming the dropdown has the id 'departmentDropdown'
  });

  // 2. Filtering the Employee table when a department is clicked
  $("#departmentDropdown").on("click", "a", function () {
    // Check which tab is active
    let id = "";
    if ($("#employee-tab").hasClass("active")) {
      id = "#ptbody tr";
    } else if ($("#departments-tab").hasClass("active")) {
      id = "#dtbody tr";
    }

    let selectedDepartment = $(this).text();

    // Show all rows first
    $(id).show();

    // Hide rows that don't match the selected department
    $(id).each(function () {
      let departmentCell = $(this).find("td").eq(1).text();
      if (departmentCell !== selectedDepartment) {
        $(this).hide();
      }
    });
  });

  function createDepartmentDropdown(allDepartments) {
    // Assuming you have a dropdown element with the id 'departmentDropdown'
    let dropdown = $("#departmentDropdown");
    dropdown.empty(); // Clear previous entries

    $.each(allDepartments, function (index, department) {
      dropdown.append($("<a href='#'>").text(department.name));
    });
  }

  let departmentChartInstance; // For department chart
  let locationChartInstance; // For location chart

  // Function to generate charts
  function generateCharts(data) {
    let departments = {};
    let locations = {};

    data.data.forEach((person) => {
      departments[person.department] =
        (departments[person.department] || 0) + 1;
      locations[person.location] = (locations[person.location] || 0) + 1;
    });

    let departmentLabels = Object.keys(departments);
    let departmentData = Object.values(departments);
    let locationLabels = Object.keys(locations);
    let locationData = Object.values(locations);

    departmentChartInstance = createChart(
      "departmentChart",
      "bar",
      departmentLabels,
      departmentData,
      "Number of Employees per Department",
      departmentChartInstance
    );
    locationChartInstance = createChart(
      "locationChart",
      "pie",
      locationLabels,
      locationData,
      "Number of Employees per Location",
      locationChartInstance
    );
  }

  function createChart(elementId, type, labels, data, title, chartInstance) {
    let ctx = document.getElementById(elementId).getContext("2d");

    // Add shadow properties to the canvas context for 3D effect
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 7;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; // Shadow color

    // Destroy the previous instance if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    const pieColors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#FF9F40",
      "#9966FF",
    ];
    const pieBorder = "#222";

    const datasets = [
      {
        label: title,
        data: data,
        backgroundColor:
          type === "pie" ? pieColors : "rgba(255, 204, 2, 0.504)",
        borderColor: type === "pie" ? pieBorder : "rgb(255, 204, 2)",
        hoverOffset: 50,
        borderWidth: 2,
      },
    ];

    const tickColor = type === "pie" ? "#212529" : "#FFD700"; // Default to black for pie charts, gold for others

    let isMobile = window.innerWidth <= 768;

    return new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: !isMobile, // Hide x-axis on mobile for clarity
            ticks: {
              color: tickColor,
              fontSize: isMobile ? 10 : 14, // Reduce font size on mobile
            },
          },
          y: {
            display: !isMobile, // Hide y-axis on mobile for clarity
            ticks: {
              color: tickColor,
              fontSize: isMobile ? 10 : 14, // Reduce font size on mobile
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: !isMobile, // Hide legend on mobile for clarity
            labels: {
              color: "white",
              font: {
                weight: "bold",
                size: isMobile ? 10 : 14, // Adjust font size based on device
              },
            },
          },
        },
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
        elements: {
          arc: {
            borderWidth: 0,
            offset: 5,
          },
          bar: {
            hoverBackgroundColor: "rgba(255, 204, 2, 0.7)", // Adjust the background color on hover
          },
        },
      },
    });
}

// Monitor window resize event
window.addEventListener('resize', function() {
  adjustTabsForMobile();
});

// Initial check
adjustTabsForMobile();

function adjustTabsForMobile() {
  const tabs = document.querySelectorAll('.nav-item .nav-link');

  if (window.innerWidth <= 768) {
      tabs.forEach(tab => {
          // Only store the original text if it hasn't been stored yet
          if (!tab.dataset.originalText) {
              tab.dataset.originalText = tab.textContent;
          }
          tab.textContent = "";
      });

  } else {
      tabs.forEach(tab => {
          // Only restore the text if the originalText data attribute exists
          if (tab.dataset.originalText) {
              tab.textContent = tab.dataset.originalText;
          }
      });
  }
}


});
