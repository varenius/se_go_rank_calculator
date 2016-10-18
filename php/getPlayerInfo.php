<?php
$lastname = $_GET['lastname'];
$firstname = $_GET['name'];

$page = file_get_contents('http://www.europeangodatabase.eu/EGD/GetPlayerDataByData.php?lastname='.$lastname.'&name='.$firstname);
echo $page;
?>
