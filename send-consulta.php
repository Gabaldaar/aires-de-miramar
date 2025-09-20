<?php

file_put_contents('debug.txt', "Consulta recibida: " . date("Y-m-d H:i:s") . "\n", FILE_APPEND);
file_put_contents('envios-ok.txt', "Enviado a {$data['email']} el " . date("Y-m-d H:i:s") . "\n", FILE_APPEND);



use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

header('Content-Type: application/json; charset=UTF-8');


$data = json_decode(file_get_contents('php://input'), true);
file_put_contents('debug.txt', print_r($data, true));

$mail = new PHPMailer(true);
$mail->CharSet = 'UTF-8';


try {
    // Configuración SMTP
    $mail->isSMTP();
    $mail->Host = 'smtp.titan.email';
    $mail->SMTPAuth = true;
    $mail->Username = 'consultas@airesdemiramar.com.ar';
    $mail->Password = 'Miramar_2025';
    $mail->SMTPSecure = 'ssl';
    $mail->Port = 465;

    // Remitente y destinatario
    $mail->setFrom('consultas@airesdemiramar.com.ar', 'Aires de Miramar');
    $mail->addAddress($data['email'], $data['nombre']);

    // Contenido
    $mail->isHTML(true);
    $mail->Subject = $data['asunto'];
    $mail->Body    = $data['htmlBody'];

    $mail->send();
    echo json_encode(['status' => 'ok']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $mail->ErrorInfo]);
}
?>
