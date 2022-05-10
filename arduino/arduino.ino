#include <Arduino.h>
#include <WiFiManager.h>  // WiFiManager by tzapu Version 2.0.11-beta
// library: ArduinoJson by Benoit Blanchon
#include <ArduinoJson.h>
// library: WebSockets by Markus Sattler Version 2.3.5
#include <WebSocketsClient.h>
#include <SocketIOclient.h>
#include <Hash.h>

// WiFi manager configuration
WiFiManager wm;
// #define WM_DEBUG_LEVEL 1
#define config_ssid "Jemuran Configuration"
#define config_pass ""
// if the board disconnected to wifi mode than 30sec (30000ms), will switch to ap & config portal mode
int lc = 0, to = 30000;

SocketIOclient socketIO;

// const char *server = "192.168.43.126";
// int port = 8080;
const char *server = "jemuran01.herokuapp.com";
int port = 80;

// id alat
String id = "server12345";
unsigned long lastChange = 0;
unsigned long last = 0;

// pin sensor hujan
int sensorPin = D5;
// pin dinamo controller
int cw = D2;
int ccw = D3;

String state, lState, cuaca, lCuaca;

void sendString(String state, String cuaca)
{
   // Send event
   String d = "[\"message\", \"" + id + " update " + state + " " + cuaca + "\"]";
   socketIO.sendEVENT(d);

   // Print JSON for debugging
   Serial.print("sending: ");
   Serial.println(d);
}
void j()
{
   digitalWrite(cw, 1);
   digitalWrite(ccw, 0);
   lastChange = millis();
   state = "jemur";
   Serial.println("menjemur");
}
void t() {
   digitalWrite(cw, 0);
   digitalWrite(ccw, 1);
   lastChange = millis();
   state = "teduh";
   Serial.println("meneduh");
}
void s(){
   digitalWrite(cw, 1);
   digitalWrite(ccw, 1);
   lastChange = 0;
   Serial.println("berhenti");
}
void handler(uint8_t *payload)
{
   StaticJsonDocument<200> xdoc;
   deserializeJson(xdoc, (char *)payload);
   const char *ev = xdoc[0];
   const char *dt = xdoc[1];
   String event = String(ev);
   String data = String(dt);

   if (event == id)
   {
      // Serial.println("[IOc] get event: " + event + " | Data: " + data);
      if(data == "jemur") j();
      else if(data == "teduh" && cuaca != "hujan") t();
      Serial.print("cuaca: "); Serial.println(cuaca);
   }
   // Serial.println("-----------------------");
}

void socketIOEvent(socketIOmessageType_t type, uint8_t *payload, size_t length)
{
   switch (type)
   {
   case sIOtype_DISCONNECT:
      Serial.printf("[IOc] Disconnected!\n");
      break;
   case sIOtype_CONNECT:
      Serial.printf("[IOc] Connected to url: %s\n", payload);
      // join default namespace (no auto join in Socket.IO V3)
      socketIO.send(sIOtype_CONNECT, "/");
      break;
   case sIOtype_EVENT:
      // Serial.printf("[IOc] get event: %s\n", payload);
      handler(payload);
      break;
   case sIOtype_ACK:
      // Serial.printf("[IOc] get ack: %u\n", length);
      hexdump(payload, length);
      break;
   case sIOtype_ERROR:
      // Serial.printf("[IOc] get error: %u\n", length);
      hexdump(payload, length);
      break;
   case sIOtype_BINARY_EVENT:
      // Serial.printf("[IOc] get binary: %u\n", length);
      hexdump(payload, length);
      break;
   case sIOtype_BINARY_ACK:
      // Serial.printf("[IOc] get binary ack: %u\n", length);
      hexdump(payload, length);
      break;
   }
}

void setup()
{
   Serial.begin(9600);
   // Serial.begin(921600);
   // Serial.setDebugOutput(true);

   delay(500);
   Serial.println();
   Serial.println();
   Serial.print("[SETUP] Starting...\n");
   Serial.println();

   // starting wemos
   WiFi.mode(WIFI_STA);
   // wipe stored credentials for testing
   // wm.resetSettings();
   // async
   wm.setConfigPortalBlocking(false);
   wm.setConfigPortalTimeout(60);  // 1 minutes timeout
   // wm.setDebugOutput(true);
   // dark mode
   wm.setDarkMode(true);

   if (!wm.autoConnect(config_ssid, config_pass)) {
      Serial.println("Failed to connect");
      ESP.restart();
   } else {
      // if you get here you have connected to the WiFi
      Serial.println("connected...yeey :)");
   }

   // server address, port and URL
   Serial.print("WS Server: ");
   Serial.println(server);
   Serial.print("WS port: ");
   Serial.println(port);
   socketIO.begin(server, port, "/socket.io/?EIO=4");
   // socketIO.beginSSL(server, port, "/socket.io/?EIO=4");
   // event handler
   socketIO.onEvent(socketIOEvent);

   pinMode(sensorPin, INPUT);
   pinMode(cw, OUTPUT);
   pinMode(ccw, OUTPUT);

   s();
   t();

   state = "teduh";
   cuaca = digitalRead(sensorPin) ? "cerah" : "hujan";
   lState = state;
   lCuaca = cuaca;
   
   pinMode(LED_BUILTIN, OUTPUT);
   digitalWrite(LED_BUILTIN, 1);
}
void loop() {
   wm.process();
   socketIO.loop();
   uint64_t now = millis();

   if (!WiFi.isConnected() && ((now - lc) > to)) {
      wm.autoConnect(config_ssid, config_pass);
      lc = now;
   } else if (WiFi.isConnected()) lc = now;

   if (wm.getConfigPortalActive()) digitalWrite(LED_BUILTIN, LOW);
   else digitalWrite(LED_BUILTIN, HIGH);

   if(socketIO.isConnected()) digitalWrite(LED_BUILTIN, 0);
   else digitalWrite(LED_BUILTIN, 1);

   if (last == 0 || now - last > 1000)
   {
      last = now != 0 ? now : 1;
      cuaca = digitalRead(sensorPin) ? "cerah" : "hujan";
      if(lastChange != 0 && now - lastChange > 3000) s();
      if(cuaca == "hujan" && state != "teduh") t();
      if(lState != state || lCuaca != cuaca) {
         if(cuaca == "hujan" && state == "jemur") t();
         if(lCuaca == "hujan" && cuaca == "cerah") j();
         if(socketIO.isConnected()) sendString(state, cuaca);
      }

      lState = state;
      lCuaca = cuaca;
   }
}
