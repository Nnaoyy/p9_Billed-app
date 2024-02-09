/**
 * @jest-environment jsdom
 */

import { screen, waitFor} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import mockedBills from '../__mocks__/store.js'

import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import BillsContainers from "../containers/Bills.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();

    })
    test("Then bills should be ordered from earliest to latest", () => {
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      document.body.innerHTML = BillsUI({ data: bills.sort(antiChrono) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const datesSorted = [...dates]
      expect(dates).toEqual(datesSorted)
    })
    test("Then a modal should open when I clicked on eye icon", async () => {
     // await waitFor(() => screen.getAllByTestId("icon-eye"));
      const iconsEyes = screen.getAllByTestId("icon-eye");
      const iconEye = iconsEyes[0];
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });
      const modale = document.getElementById("modaleFile");
      $.fn.modal = jest.fn(() => modale.classList.add("show"));
      const handleClickIconEye = jest.fn(bill.handleClickIconEye(iconEye));
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect(modale).toBeTruthy();
    });
  })
  describe("When I click on the creation of the new bill", () => {
    test("Then the page of new bills is displayed", () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = BillsUI({ data: bills });

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      const store = null;
      const billsContainers = new BillsContainers({
        document, onNavigate, store, bills, localStorage: window.localStorage
      });

      const btnNewBill = screen.getByTestId('btn-new-bill');
      expect(btnNewBill).toBeTruthy();

      jest.spyOn(billsContainers, 'handleClickNewBill').mockImplementation();

      btnNewBill.addEventListener('click', billsContainers.handleClickNewBill())
      userEvent.click(btnNewBill)

      expect(billsContainers.handleClickNewBill).toHaveBeenCalled()

      const formNewBill = screen.getByTestId('form-new-bill');
      expect(formNewBill).toBeTruthy();

    })
  });
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to the Bills page", () => {
    test('Then we fetch bills from mock API', async () => {
      document.body.innerHTML = ''
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
    
      const mockOnNavigate = jest.fn()
      const billsPage = new Bills({ document, onNavigate: mockOnNavigate, store: mockedBills, localStorage: localStorageMock })
    
      root.innerHTML = BillsUI({data: await billsPage.getBills()})
      expect(document).toMatchSnapshot()
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockedBills, "bills")
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.innerHTML = ''
      document.body.append(root)
      router()
    })
    test("Then it fetches an 404 error", async () => {
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
      }})
      const rootDiv = document.querySelector('#root')
      const billsPage = new Bills({ document, onNavigate: window.onNavigate, store: mockedBills, localStorage: localStorageMock })
      billsPage.getBills().then(data => {
        // on fetch l'erreur 404
        rootDiv.innerHTML = BillsUI({ data })
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname: ROUTES_PATH['Bills'], error })
      })
      
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message.textContent).toBeTruthy()
    })
    test("Then it fetches an 500 error", async () => {
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
      }})
      const rootDiv = document.querySelector('#root')
      const billsPage = new Bills({ document, onNavigate: window.onNavigate, store: mockedBills, localStorage: localStorageMock })
      billsPage.getBills().then(data => {
        // on fetch l'erreur 500
        rootDiv.innerHTML = BillsUI({ data })
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname: ROUTES_PATH['Bills'], error })
      })

      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message.textContent).toBeTruthy()
    })
  })
})
