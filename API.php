<?php

// Remove next two lines for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);
$output = array();

// connection details for MySQL database
$cd_host = "127.0.0.1";
$cd_port = 3306;
$cd_socket = "";

// database name, username and password
$cd_dbname = "company_directory";
$cd_user = "root";
$cd_password = "";

header('Content-Type: application/json; charset=UTF-8');

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

if (mysqli_connect_errno()) {
    $output['status']['code'] = "300";
    $output['status']['name'] = "failure";
    $output['status']['description'] = "database unavailable";
    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
    $output['data'] = [];

    mysqli_close($conn);

    echo json_encode($output);
    exit;
}

$action = $_REQUEST['action'];

if ($action == 'getAll') {
    getAll();
} elseif ($action == 'deleteDepartmentByID') {
    deleteDepartmentByID();
} elseif ($action == 'getDepartmentByID') {
    getDepartmentByID();
} elseif ($action == 'getAllDepartments') {
    getAllDepartments();
} elseif ($action == 'addLocation') {
    addLocation();
} elseif ($action == 'editLocationByID') {
    editLocationByID();
} elseif ($action == 'checkLocationInDepartment') {
    checkLocationInDepartment();
} elseif ($action == 'deleteLocationByID') {
    deleteLocationByID();
} elseif ($action == 'getAllLocations') {
    getAllLocations();
} elseif ($action == 'getEmployeeByID') {
    getEmployeeByID();
} elseif ($action == 'insertDepartmentByID') {
    insertDepartmentByID();
} elseif ($action == 'updateEmployee') {
    updateEmployee();
} elseif ($action == 'deleteEmployeeByID') {
    deleteEmployeeByID();
} elseif ($action == 'isDepartmentLinked') {
    isDepartmentLinked();
} elseif ($action == 'updateDepartmentByID') {
    updateDepartmentByID();
} elseif ($action == 'createEmployee') {
    createEmployee();
} else {
    $output['status']['code'] = "400";
    $output['status']['name'] = "executed";
    $output['status']['description'] = "Invalid action";
    $output['data'] = [];
    mysqli_close($conn);
    echo json_encode($output);
    exit;
}

function getAll()
{
    global $conn, $executionStartTime, $output;
    $query = 'SELECT p.id, p.lastName, p.firstName, p.jobTitle, p.email, d.name as department, l.name as location
              FROM personnel p
              LEFT JOIN department d ON (d.id = p.departmentID)
              LEFT JOIN location l ON (l.id = d.locationID)
              ORDER BY p.lastName, p.firstName, d.name, l.name';

    $result = $conn->query($query);

    if (!$result) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            array_push($data, $row);
        }
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = $data;
    }
}

function deleteDepartmentByID()
{
    global $conn, $executionStartTime, $output;

    // Check if the department is linked to any employees
    $checkQuery = $conn->prepare('SELECT COUNT(*) as count FROM personnel WHERE departmentID = ?');
    $checkQuery->bind_param("i", $_REQUEST['id']);
    $checkQuery->execute();

    $result = $checkQuery->get_result();
    $row = $result->fetch_assoc();

    if($row['count'] > 0) {
        // The department is linked to one or more employees
        $output['status']['code'] = "409"; // Conflict
        $output['status']['name'] = "linked";
        $output['status']['description'] = "Department is linked to employees";
        $output['data'] = [];
    } else {
        // The department is not linked to any employees, so we can delete it
        $deleteQuery = $conn->prepare('DELETE FROM department WHERE id = ?');
        $deleteQuery->bind_param("i", $_REQUEST['id']);
        $deleteQuery->execute();

        if (!$deleteQuery) {
            $output['status']['code'] = "400";
            $output['status']['name'] = "executed";
            $output['status']['description'] = "query failed";
            $output['data'] = [];
        } else {
            $output['status']['code'] = "200";
            $output['status']['name'] = "ok";
            $output['status']['description'] = "success";
            $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
            $output['data'] = [];
        }
    }
}

function isDepartmentLinked()
{
    global $conn, $executionStartTime, $output;

    // Fetch the department name based on the ID
    $nameQuery = $conn->prepare('SELECT name FROM department WHERE id = ?');
    $nameQuery->bind_param("i", $_REQUEST['id']);
    $nameQuery->execute();
    $nameResult = $nameQuery->get_result();
    $nameRow = $nameResult->fetch_assoc();
    $departmentName = $nameRow['name'];

    // Check if the department is linked to any employees
    $checkQuery = $conn->prepare('SELECT COUNT(*) as count FROM personnel WHERE departmentID = ?');
    $checkQuery->bind_param("i", $_REQUEST['id']);
    $checkQuery->execute();
    $result = $checkQuery->get_result();
    $row = $result->fetch_assoc();

    if($row['count'] > 0) {
        // The department is linked to one or more employees
        $output['status']['code'] = "409"; // Conflict
        $output['status']['name'] = "linked";
        $output['status']['description'] = "Department is linked to employees";
        $output['data']['departmentName'] = $departmentName;
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "Department is not linked to employees";
        $output['data']['departmentName'] = $departmentName;
    }
}

// Add a new location
function addLocation() {
    global $conn, $executionStartTime, $output;

    $locationName = $_REQUEST['locationName'];

    // Fetch the last location ID
    $idQuery = $conn->query("SELECT MAX(id) as lastID FROM location");
    $lastIDRow = $idQuery->fetch_assoc();
    $newID = $lastIDRow['lastID'] + 1; // New ID is last ID + 1

    $query = $conn->prepare('INSERT INTO location (id, name) VALUES(?, ?)');
    $query->bind_param("is", $newID, $locationName);
    $query->execute();

    if (!$query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "Location added successfully";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}

function getDepartmentByID()
{
    global $conn, $executionStartTime, $output;
    $query = $conn->prepare('SELECT id, name, locationID FROM department WHERE id = ?');
    $query->bind_param("i", $_REQUEST['id']);
    $query->execute();
    if (false === $query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $result = $query->get_result();
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            array_push($data, $row);
        }
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = $data;
    }
}

function getAllLocations() {
    global $conn, $executionStartTime, $output;

    $query = 'SELECT id, name FROM location ORDER BY name';
    $result = $conn->query($query);

    if (!$result) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            array_push($data, $row);
        }
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = $data;
    }
}

function checkLocationInDepartment() {
    global $conn, $executionStartTime, $output;

    $locationID = $_REQUEST['locationID'];
    $query = $conn->prepare("SELECT * FROM department WHERE locationID = ?");
    $query->bind_param('i', $locationID);
    $query->execute();
    $result = $query->get_result();
    if ($result->num_rows > 0) {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "Location is linked to a department";
        $output['data']['isInDepartment'] = true;
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "Location is not linked to any department";
        $output['data']['isInDepartment'] = false;
    }
}

function deleteLocationByID() {
    global $conn, $executionStartTime, $output;

    $locationID = $_REQUEST['locationID'];
    $query = $conn->prepare("DELETE FROM location WHERE id = ?");
    $query->bind_param('i', $locationID);
    if ($query->execute()) {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "Location deleted successfully";
        $output['data'] = [];
    } else {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "Location deletion failed";
        $output['data'] = [];
    }
}

function getAllDepartments()
{
    global $conn, $executionStartTime, $output;
    
    // Modified SQL query to include location details
    $query = 'SELECT d.id, d.name, d.locationID, l.name as locationName
              FROM department d
              LEFT JOIN location l
              ON (d.locationID = l.id)';
    
    $result = $conn->query($query);
    
    if (!$result) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            array_push($data, $row);
        }
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = $data;
    }
}

function editLocationByID() {
    global $conn, $executionStartTime, $output;

    $locationID = $_REQUEST['locationID'];
    $locationName = $_REQUEST['locationName'];

    // Validation
    if(empty($locationID) || empty($locationName)) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "validation error";
        $output['status']['description'] = "locationID or locationName is missing";
        echo json_encode($output);
        exit;
    }

    $query = $conn->prepare("UPDATE location SET name = ? WHERE id = ?");
    $query->bind_param('si', $locationName, $locationID);
    $query->execute();

    if (!$query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        if ($query->affected_rows === 0) {
            $output['status']['code'] = "404";
            $output['status']['name'] = "no changes";
            $output['status']['description'] = "No changes made. Either no matching location or same values provided.";
        } else {
            $output['status']['code'] = "200";
            $output['status']['name'] = "ok";
            $output['status']['description'] = "Location name updated successfully";
        }
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}

function getEmployeeByID()
{
    global $conn, $executionStartTime, $output;

    // Modified SQL query to include department and location details
    $query = $conn->prepare('SELECT p.id, p.firstName, p.lastName, p.jobTitle, p.email, d.name as department, l.name as location
                             FROM personnel p
                             LEFT JOIN department d ON (d.id = p.departmentID)
                             LEFT JOIN location l ON (l.id = d.locationID)
                             WHERE p.id = ?');
    $query->bind_param("i", $_REQUEST['id']);
    $query->execute();

    if (false === $query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $result = $query->get_result();
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            array_push($data, $row);
        }
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = $data;
    }
}

function getLocationIdByName($locationName) {
    global $conn;

    $query = $conn->prepare('SELECT id FROM location WHERE name = ?');
    $query->bind_param("s", $locationName);
    $query->execute();

    $result = $query->get_result();
    $row = $result->fetch_assoc();

    return $row ? $row['id'] : null;
}

function insertDepartmentByID() {
    global $conn, $executionStartTime, $output;

    $locationName = $_REQUEST['location'];
    $locationID = getLocationIdByName($locationName);
    
    if(!$locationID) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "Location doesn't exist";
        echo json_encode($output);
        exit;
    }

    // Fetch the last department ID
    $idQuery = $conn->query("SELECT MAX(id) as lastID FROM department");
    $lastIDRow = $idQuery->fetch_assoc();
    $newID = $lastIDRow['lastID'] + 1; // New ID is last ID + 1

    $query = $conn->prepare('INSERT INTO department (id, name, locationID) VALUES(?,?,?)');
    $query->bind_param("isi", $newID, $_REQUEST['name'], $locationID);
    $query->execute();

    if (!$query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}

function deleteEmployeeByID()
{
    global $conn, $executionStartTime, $output;
    $id = $_REQUEST['id'];
    $query = $conn->prepare('DELETE FROM personnel WHERE id = ?');
    $query->bind_param("i", $id);
    $query->execute();

    if (false === $query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}

function createEmployee() {
    global $conn, $executionStartTime, $output;

    // Extract data from the request
    $firstName = $_REQUEST['firstName'];
    $lastName = $_REQUEST['lastName'];
    $email = $_REQUEST['email'];
    $jobTitle = $_REQUEST['jobTitle'];
    $departmentID = $_REQUEST['departmentID'];

    // Fetch the last personnel ID
    $idQuery = $conn->query("SELECT MAX(id) as lastID FROM personnel");
    $lastIDRow = $idQuery->fetch_assoc();
    $newID = $lastIDRow['lastID'] + 1; // New ID is last ID + 1

    // Insert a new Employee record with the new ID
    $query = $conn->prepare('INSERT INTO personnel (id, firstName, lastName, email, jobTitle, departmentID) 
                             VALUES (?, ?, ?, ?, ?, ?)');
    $query->bind_param("issssi", $newID, $firstName, $lastName, $email, $jobTitle, $departmentID);
    $query->execute();

    if (false === $query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}
function updateEmployee() {
    global $conn, $executionStartTime, $output;

    // Extract data from the request
    $id = $_REQUEST['id'];
    $firstName = $_REQUEST['firstName'];
    $lastName = $_REQUEST['lastName'];
    $email = $_REQUEST['email'];
    $jobTitle = $_REQUEST['jobTitle'];
    $departmentID = $_REQUEST['departmentID'];

    // Perform the update operation
    $query = $conn->prepare('UPDATE personnel
                             SET firstName = ?, lastName = ?, email = ?, jobTitle = ?, departmentID = ?
                             WHERE id = ?');
    $query->bind_param("ssssii", $firstName, $lastName, $email, $jobTitle, $departmentID, $id);
    $query->execute();

    if (false === $query) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed";
        $output['data'] = [];
    } else {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}
function updateDepartmentByID() {
    global $conn, $executionStartTime, $output;

    $departmentName = $_REQUEST['name']; // Get the department name from the request
    $locationName = $_REQUEST['location'];
    $locationID = getLocationIdByName($locationName);

    if(!$locationID) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "Location doesn't exist";
        echo json_encode($output);
        exit;
    }

    $query = $conn->prepare('UPDATE department SET name = ?, locationID = ? WHERE id = ?');
    $query->bind_param("sii", $departmentName, $locationID, $_REQUEST['id']); // Bind the department name as well
    $result = $query->execute();

    if (!$result) {
        $output['status']['code'] = "400";
        $output['status']['name'] = "executed";
        $output['status']['description'] = "query failed: " . $conn->error; 
        $output['data'] = [];
    } else {
        if ($query->affected_rows === 0) {
            $output['status']['code'] = "404";
            $output['status']['name'] = "no changes";
            $output['status']['description'] = "No changes made. Either no matching department or same values provided.";
        } else {
            $output['status']['code'] = "200";
            $output['status']['name'] = "ok";
            $output['status']['description'] = "success";
        }
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['data'] = [];
    }
}


mysqli_close($conn);

echo json_encode($output);
