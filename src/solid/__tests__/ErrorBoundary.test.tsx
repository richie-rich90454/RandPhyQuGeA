import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import type {JSX} from "solid-js";
import {ErrorBoundaryRetry} from "../components/ErrorBoundary";
function Stable(): JSX.Element {
    return <div>Stable content</div>;
}
function Thrower(): JSX.Element {
    throw new Error("boom");
}
describe("ErrorBoundaryRetry", () => {
    it("renders children when no error occurs", () => {
        render(() => (
            <ErrorBoundaryRetry>
                <Stable />
            </ErrorBoundaryRetry>
        ));
        expect(screen.getByText("Stable content")).toBeInTheDocument();
    });
    it("renders fallback when child throws", () => {
        render(() => (
            <ErrorBoundaryRetry>
                <Thrower />
            </ErrorBoundaryRetry>
        ));
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/boom/)).toBeInTheDocument();
    });
    it("shows retry button when under max retries", () => {
        render(() => (
            <ErrorBoundaryRetry maxRetries={3}>
                <Thrower />
            </ErrorBoundaryRetry>
        ));
        expect(screen.getByRole("button", {name: /try again/i})).toBeInTheDocument();
    });
    it("shows exhausted message when retries are exhausted", () => {
        render(() => (
            <ErrorBoundaryRetry maxRetries={0}>
                <Thrower />
            </ErrorBoundaryRetry>
        ));
        expect(screen.getByText(/maximum retries reached/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: /try again/i})).not.toBeInTheDocument();
    });
    it("renders custom fallback when provided", () => {
        render(() => (
            <ErrorBoundaryRetry fallback={err => <div>Custom: {err.message}</div>}>
                <Thrower />
            </ErrorBoundaryRetry>
        ));
        expect(screen.getByText("Custom: boom")).toBeInTheDocument();
    });
    it("increments retry count and eventually exhausts", () => {
        render(() => (
            <ErrorBoundaryRetry maxRetries={2}>
                <Thrower />
            </ErrorBoundaryRetry>
        ));
        expect(screen.getByRole("button", {name: /try again/i})).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: /try again/i}));
        expect(screen.getByRole("button", {name: /try again/i})).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: /try again/i}));
        expect(screen.queryByRole("button", {name: /try again/i})).not.toBeInTheDocument();
        expect(screen.getByText(/maximum retries reached/i)).toBeInTheDocument();
    });
});
