import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from time import sleep

class TestExample(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # This method runs once before all the tests start
        cls.driver = webdriver.Chrome()  # Assuming you have Chrome WebDriver installed
        cls.driver.implicitly_wait(10)   # Add an implicit wait to handle element loading
        cls.driver.get("http://localhost:5500")
    @classmethod
    def tearDownClass(cls):
        # This method runs once after all the tests have finished
        cls.driver.quit()

    def test_page_title(self):
        # Test for the title of the page
        expected_title = "Map Practice | A Game To Learn Placing Countries"
        actual_title = self.driver.title
        self.assertEqual(actual_title, expected_title, f"Expected title: {expected_title}, Actual title: {actual_title}")

    def test_map_exists(self):
        # Test for the map element
        map_element = self.driver.find_element(By.ID, "map")
        self.assertTrue(map_element.is_displayed(), "Map element is not displayed")

    def test_correct_guess(self):
        # first, toggle #tiny-country-check:
        check_box = self.driver.find_element(By.ID, "tiny-country-check-wrapper")
        check_box.click()
        # find #challengeCountry and extract the country to guess from innerHTML
        # then, find the path with an equivalent name!! property within #map (NOT id)
        # ensure that #stats-units is now 1:
        map_element = self.driver.find_element(By.ID, "map")
        challenge_country = self.driver.find_element(By.ID, "challengeCountry").get_attribute("innerHTML")
        path_to_click = self.driver.find_element(By.NAME, challenge_country)
        path_to_click.click()
        stats_units = self.driver.find_element(By.ID, "stats-units").get_attribute("innerHTML")
        self.assertEqual(stats_units, "1", "Stats units is not 1")
        # ensure that stats-thinking-time is not 'N/A'
        stats_thinking_time = self.driver.find_element(By.ID, "stats-thinking-time").get_attribute("innerHTML")
        self.assertNotEqual(stats_thinking_time, "N/A", "Stats thinking time is N/A")
        # wait 2.1 seconds, and check that challengeCountry is not the same as before
        # (i.e. that the country has changed)
        sleep(2.1)
        challenge_country_after = self.driver.find_element(By.ID, "challengeCountry").get_attribute("innerHTML")
        self.assertNotEqual(challenge_country, challenge_country_after, "Challenge country has not changed")


if __name__ == "__main__":
    unittest.main()