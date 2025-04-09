-- MySQL dump 10.13  Distrib 9.2.0, for Win64 (x86_64)
--
-- Host: localhost    Database: karsafar_db
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accomamenitymap`
--

DROP TABLE IF EXISTS `accomamenitymap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accomamenitymap` (
  `accomId` binary(16) NOT NULL,
  `amenityId` binary(16) NOT NULL,
  PRIMARY KEY (`accomId`,`amenityId`),
  KEY `amenityId` (`amenityId`),
  CONSTRAINT `accomamenitymap_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE,
  CONSTRAINT `accomamenitymap_ibfk_2` FOREIGN KEY (`amenityId`) REFERENCES `accommodationamenities` (`amenityId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accombookingrooms`
--

DROP TABLE IF EXISTS `accombookingrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accombookingrooms` (
  `bookingRoomId` binary(16) NOT NULL,
  `accomItemId` binary(16) NOT NULL,
  `roomId` binary(16) NOT NULL,
  `roomNumber` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`bookingRoomId`),
  KEY `accomItemId` (`accomItemId`),
  KEY `roomId` (`roomId`),
  CONSTRAINT `accombookingrooms_ibfk_1` FOREIGN KEY (`accomItemId`) REFERENCES `accommodationbookingitems` (`accomItemId`) ON DELETE CASCADE,
  CONSTRAINT `accombookingrooms_ibfk_2` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accommodationaddresses`
--

DROP TABLE IF EXISTS `accommodationaddresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationaddresses` (
  `addressId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `street` varchar(100) NOT NULL,
  `landmark` varchar(100) DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) DEFAULT NULL,
  `pinCode` varchar(10) DEFAULT NULL,
  `country` varchar(50) NOT NULL,
  PRIMARY KEY (`addressId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `accommodationaddresses_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accommodationamenities`
--

DROP TABLE IF EXISTS `accommodationamenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationamenities` (
  `amenityId` binary(16) NOT NULL,
  `amenityType` varchar(50) NOT NULL,
  PRIMARY KEY (`amenityId`),
  UNIQUE KEY `amenityType` (`amenityType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accommodationbookingitems`
--

DROP TABLE IF EXISTS `accommodationbookingitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationbookingitems` (
  `accomItemId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `checkInDate` date NOT NULL,
  `checkOutDate` date NOT NULL,
  `contactName` varchar(100) NOT NULL,
  `contactPhoneNo` varchar(15) NOT NULL,
  `contactEmail` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('confirmed','pending','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`accomItemId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `accommodationbookingitems_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accommodationphotos`
--

DROP TABLE IF EXISTS `accommodationphotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationphotos` (
  `photoId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `photoUrl` varchar(255) NOT NULL,
  PRIMARY KEY (`photoId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `accommodationphotos_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accommodations`
--

DROP TABLE IF EXISTS `accommodations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodations` (
  `accomId` binary(16) NOT NULL,
  `accomType` enum('hotel','airbnb') NOT NULL,
  `name` varchar(100) NOT NULL,
  `phoneNo` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`accomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `airbnbs`
--

DROP TABLE IF EXISTS `airbnbs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `airbnbs` (
  `accomId` binary(16) NOT NULL,
  `maxAllowedGuests` int NOT NULL,
  PRIMARY KEY (`accomId`),
  CONSTRAINT `airbnbs_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bookingitems`
--

DROP TABLE IF EXISTS `bookingitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookingitems` (
  `bookingItemId` binary(16) NOT NULL,
  `bookingId` binary(16) NOT NULL,
  `itemType` enum('vehicle','accommodation') NOT NULL,
  `vehicleItemId` binary(16) DEFAULT NULL,
  `accomItemId` binary(16) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`bookingItemId`),
  KEY `bookingId` (`bookingId`),
  KEY `vehicleItemId` (`vehicleItemId`),
  KEY `accomItemId` (`accomItemId`),
  CONSTRAINT `bookingitems_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`bookingId`) ON DELETE CASCADE,
  CONSTRAINT `bookingitems_ibfk_2` FOREIGN KEY (`vehicleItemId`) REFERENCES `vehiclebookingitems` (`vehicleItemId`) ON DELETE SET NULL,
  CONSTRAINT `bookingitems_ibfk_3` FOREIGN KEY (`accomItemId`) REFERENCES `accommodationbookingitems` (`accomItemId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_insert_bookingItems` BEFORE INSERT ON `bookingitems` FOR EACH ROW BEGIN
    -- Ensure only one of vehicleItemId or accomItemId is set based on itemType
    IF (NEW.itemType = 'vehicle' AND (NEW.vehicleItemId IS NULL OR NEW.accomItemId IS NOT NULL)) OR
       (NEW.itemType = 'accommodation' AND (NEW.accomItemId IS NULL OR NEW.vehicleItemId IS NOT NULL)) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid itemType: vehicleItemId and accomItemId must match itemType';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_update_bookingItems` BEFORE UPDATE ON `bookingitems` FOR EACH ROW BEGIN
    -- Ensure only one of vehicleItemId or accomItemId is set based on itemType
    IF (NEW.itemType = 'vehicle' AND (NEW.vehicleItemId IS NULL OR NEW.accomItemId IS NOT NULL)) OR
       (NEW.itemType = 'accommodation' AND (NEW.accomItemId IS NULL OR NEW.vehicleItemId IS NOT NULL)) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid itemType: vehicleItemId and accomItemId must match itemType';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `bookingId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `tripId` binary(16) DEFAULT NULL,
  `totalPrice` decimal(10,2) NOT NULL,
  `status` enum('confirmed','pending','cancelled') DEFAULT 'pending',
  `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bookingId`),
  KEY `userId` (`userId`),
  KEY `tripId` (`tripId`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`tripId`) REFERENCES `trips` (`tripId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `buses`
--

DROP TABLE IF EXISTS `buses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buses` (
  `vehicleId` binary(16) NOT NULL,
  `busName` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `buses_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cabs`
--

DROP TABLE IF EXISTS `cabs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabs` (
  `vehicleId` binary(16) NOT NULL,
  `carModel` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `cabs_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cruises`
--

DROP TABLE IF EXISTS `cruises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cruises` (
  `vehicleId` binary(16) NOT NULL,
  `cruiseName` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `cruises_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flights`
--

DROP TABLE IF EXISTS `flights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flights` (
  `vehicleId` binary(16) NOT NULL,
  `flightName` varchar(100) NOT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `flights_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hotels`
--

DROP TABLE IF EXISTS `hotels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotels` (
  `accomId` binary(16) NOT NULL,
  `breakfastIncluded` tinyint(1) DEFAULT '0',
  `acType` enum('AC','NON-AC','BOTH') NOT NULL,
  PRIMARY KEY (`accomId`),
  CONSTRAINT `hotels_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `passengerseats`
--

DROP TABLE IF EXISTS `passengerseats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passengerseats` (
  `passengerId` binary(16) NOT NULL,
  `vehicleItemId` binary(16) NOT NULL,
  `seatId` binary(16) NOT NULL,
  `name` varchar(100) NOT NULL,
  `age` int NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `foodPreference` enum('veg','non-veg','vegan','none') DEFAULT 'none',
  PRIMARY KEY (`passengerId`),
  UNIQUE KEY `unique_vehicle_seat` (`vehicleItemId`,`seatId`),
  KEY `seatId` (`seatId`),
  CONSTRAINT `passengerseats_ibfk_1` FOREIGN KEY (`vehicleItemId`) REFERENCES `vehiclebookingitems` (`vehicleItemId`) ON DELETE CASCADE,
  CONSTRAINT `passengerseats_ibfk_2` FOREIGN KEY (`seatId`) REFERENCES `seats` (`seatId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `paymentId` binary(16) NOT NULL,
  `bookingId` binary(16) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid` tinyint(1) DEFAULT '0',
  `paymentMethod` varchar(50) DEFAULT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  `paymentDate` timestamp NULL DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  PRIMARY KEY (`paymentId`),
  KEY `bookingId` (`bookingId`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`bookingId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `reviewId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `itemType` enum('vehicle','accommodation','trip') NOT NULL,
  `itemId` binary(16) NOT NULL,
  `rating` decimal(3,2) NOT NULL,
  `comment` text,
  `reviewDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reviewId`),
  UNIQUE KEY `unique_user_review` (`userId`,`itemType`,`itemId`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 0 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `roomId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `roomType` varchar(50) NOT NULL,
  `roomsAvailable` int NOT NULL,
  `pplAccommodated` int NOT NULL,
  `roomDescription` text,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`roomId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `seatId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `coachId` varchar(5) NOT NULL,
  `seatNumber` varchar(5) NOT NULL,
  PRIMARY KEY (`seatId`),
  UNIQUE KEY `unique_seat` (`vehicleId`,`coachId`,`seatNumber`),
  KEY `coachId` (`coachId`),
  CONSTRAINT `seats_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE,
  CONSTRAINT `seats_ibfk_2` FOREIGN KEY (`coachId`) REFERENCES `vehiclecoaches` (`coachId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trains`
--

DROP TABLE IF EXISTS `trains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trains` (
  `vehicleId` binary(16) NOT NULL,
  `trainName` varchar(100) NOT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `trains_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `tripId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `name` varchar(100) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `status` enum('planning','booked','ongoing','completed','cancelled') DEFAULT 'planning',
  PRIMARY KEY (`tripId`),
  KEY `userId` (`userId`),
  CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `useraddresses`
--

DROP TABLE IF EXISTS `useraddresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraddresses` (
  `addressId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `street` varchar(100) DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) DEFAULT NULL,
  `pinCode` varchar(10) DEFAULT NULL,
  `country` varchar(50) NOT NULL,
  PRIMARY KEY (`addressId`),
  KEY `userId` (`userId`),
  CONSTRAINT `useraddresses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userId` binary(16) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `phoneNo` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(256) NOT NULL,
  `profilePicture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehiclebookingitems`
--

DROP TABLE IF EXISTS `vehiclebookingitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiclebookingitems` (
  `vehicleItemId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `onboardingLocation` varchar(100) NOT NULL,
  `deboardingLocation` varchar(100) NOT NULL,
  `onboardingTime` datetime NOT NULL,
  `deboardingTime` datetime NOT NULL,
  `coachType` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('confirmed','pending','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`vehicleItemId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `vehiclebookingitems_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehiclecoaches`
--

DROP TABLE IF EXISTS `vehiclecoaches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiclecoaches` (
  `coachId` varchar(5) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `coachType` varchar(50) NOT NULL,
  `seatsAvailable` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`coachId`),
  UNIQUE KEY `unique_vehicle_coach` (`vehicleId`,`coachType`),
  CONSTRAINT `vehiclecoaches_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicledrivers`
--

DROP TABLE IF EXISTS `vehicledrivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicledrivers` (
  `driverId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `driverName` varchar(100) NOT NULL,
  `driverPhoneNo` varchar(15) NOT NULL,
  PRIMARY KEY (`driverId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `vehicledrivers_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `vehicleId` binary(16) NOT NULL,
  `vehicleType` enum('train','flight','bus','cab','cruise') NOT NULL,
  `status` enum('active','maintenance','cancelled') DEFAULT 'active',
  `availableSeats` int NOT NULL,
  PRIMARY KEY (`vehicleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehiclestations`
--

DROP TABLE IF EXISTS `vehiclestations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiclestations` (
  `stationId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `stationName` varchar(100) NOT NULL,
  `arrivalTime` datetime DEFAULT NULL,
  `departureTime` datetime DEFAULT NULL,
  `stoppage` int DEFAULT NULL,
  `stationOrder` int NOT NULL,
  PRIMARY KEY (`stationId`),
  UNIQUE KEY `unique_vehicle_station_order` (`vehicleId`,`stationOrder`),
  CONSTRAINT `vehiclestations_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-29 19:28:20
