<?php
$egdPin = $_GET['egdPin'];
$page = file_get_contents('http://www.europeangodatabase.eu/EGD/Player_Card.php?switch_panel=3&key='.$egdPin);
echo $page;
?>
