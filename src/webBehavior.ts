/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    export interface ChicletSlicerBehaviorOptions {
        slicerItemContainers: Selection<any>;
        slicerItemLabels: Selection<any>;
        slicerItemInputs: Selection<any>;
        slicerClear: Selection<any>;
        dataPoints: ChicletSlicerDataPoint[];
       // interactivityService: IInteractivityService;
        slicerSettings: ChicletSlicerSettings;
        isSelectionLoaded: boolean;
    }

    export interface IInteractiveBehavior {
        /*
        bindEvents(behaviorOptions: any, selectionHandler: ISelectionHandler): void;
        renderSelection(hasSelection: boolean): void;

        hoverLassoRegion?(e: MouseEvent, rect: shapes.BoundingRect): void;
        lassoSelect?(e: MouseEvent, rect: shapes.BoundingRect): void;
        */
    }

    export class ChicletSlicerWebBehavior implements IInteractiveBehavior {
        private slicers: Selection<any>;
        private slicerItemLabels: Selection<any>;
        private slicerItemInputs: Selection<any>;
        private dataPoints: ChicletSlicerDataPoint[];
       // private interactivityService: IInteractivityService;
        private slicerSettings: ChicletSlicerSettings;
        private options: ChicletSlicerBehaviorOptions;

        private selectionManager: ISelectionManager

        constructor(selectionManager: ISelectionManager) {
            this.selectionManager = selectionManager;
        }

        public bindEvents(options: ChicletSlicerBehaviorOptions): void {
            var slicers = this.slicers = options.slicerItemContainers;

            this.slicerItemLabels = options.slicerItemLabels;
            this.slicerItemInputs = options.slicerItemInputs;

            var slicerClear = options.slicerClear;

            this.dataPoints = options.dataPoints;
            //this.interactivityService = options.interactivityService;
            this.slicerSettings = options.slicerSettings;
            this.options = options;

            if (!this.options.isSelectionLoaded) {
                //this.loadSelection(selectionHandler);
            }

            slicers.on("mouseover", (d: ChicletSlicerDataPoint) => {
                if (d.selectable) {
                    d.mouseOver = true;
                    d.mouseOut = false;

                    this.renderMouseover();
                }
            });

            slicers.on("mouseout", (d: ChicletSlicerDataPoint) => {
                if (d.selectable) {
                    d.mouseOver = false;
                    d.mouseOut = true;

                    this.renderMouseover();
                }
            });

            slicers.on("click", (dataPoint: ChicletSlicerDataPoint, index) => {
                if (!dataPoint.selectable) {
                    return;
                }

                (d3.event as Event).preventDefault();
                //d3.event.preventDefault();

                var settings: ChicletSlicerSettings = this.slicerSettings;

                if ((d3.event as KeyboardEvent).altKey && settings.general.multiselect) {
                    var selectedIndexes = jQuery.map(this.dataPoints, (d, index) => {
                        if (d.selected) {
                            return index;
                        };
                    });

                    var selIndex = selectedIndexes.length > 0
                        ? (selectedIndexes[selectedIndexes.length - 1])
                        : 0;

                    if (selIndex > index) {
                        var temp = index;
                        index = selIndex;
                        selIndex = temp;
                    }
                    var selectedItems = [];

                    for (let i: number = selIndex; i <= index; i++) {
                        selectedItems.push(this.dataPoints[i].identity);
                    }

                    this.selectionManager.clear().then(() => {
                        this.selectionManager.select(selectedItems, true).then((ids: ISelectionId[]) => this.renderSelection(ids));
                    });
                }
                else if (((d3.event as KeyboardEvent).ctrlKey || (d3.event as KeyboardEvent).metaKey) && settings.general.multiselect) {
                   this.selectionManager.select(dataPoint.identity, true).then((ids: ISelectionId[]) => this.renderSelection(ids));;
                }
                else {
                    this.selectionManager.select(dataPoint.identity, false).then((ids: ISelectionId[]) => this.renderSelection(ids));;
                }

                //this.saveSelection(selectionHandler);

            });

            slicerClear.on("click", (d: SelectableDataPoint) => {
                this.selectionManager.clear().then((ids: ISelectionId[]) => this.renderSelection(ids));
                //this.saveSelection(selectionHandler);
            });
        }

        /*
        public loadSelection(selectionHandler: ISelectionHandler): void {
            selectionHandler.handleClearSelection();
            var savedSelectionIds = this.slicerSettings.general.getSavedSelection();
            if (savedSelectionIds.length) {
                var selectedDataPoints = this.dataPoints.filter(d => savedSelectionIds.some(x => d.identity.getKey() === x));
                selectedDataPoints.forEach(x => selectionHandler.handleSelection(x, true));
                selectionHandler.persistSelectionFilter(chicletSlicerProps.filterPropertyIdentifier);
            }
        }

        private static getFilterFromSelectors(selectionHandler: ISelectionHandler, isSelectionModeInverted: boolean): SemanticFilter {
            var selectors: Selector[] = [];
            var selectedIds: SelectionId[] = <SelectionId[]>(<any>selectionHandler).selectedIds;

            if (selectedIds.length > 0) {
                selectors = _.chain(selectedIds)
                    .filter((value: SelectionId) => value.hasIdentity())
                    .map((value: SelectionId) => value.getSelector())
                    .value();
            }

            var filter: SemanticFilter = Selector.filterFromSelector(selectors, isSelectionModeInverted);
            return filter;
        }

        public saveSelection(selectionHandler: ISelectionHandler): void {
            var filter: SemanticFilter = ChicletSlicerWebBehavior.getFilterFromSelectors(selectionHandler, this.interactivityService.isSelectionModeInverted());
            var selectionIdKeys = (<SelectionId[]>(<any>selectionHandler).selectedIds).map(x => x.getKey());
            this.slicerSettings.general.setSavedSelection(filter, selectionIdKeys);
        }

 */
        public renderSelection(ids: ISelectionId[]): void {

            if (!this.selectionManager.hasSelection()/* && !this.interactivityService.isSelectionModeInverted()*/) {
                this.slicers.style('background', this.slicerSettings.slicerText.unselectedColor);
            }
            else {
                this.styleSlicerInputs(this.slicers, ids);
            }

           //this.saveSelection();
        }

        private renderMouseover(): void {
            this.slicerItemLabels.style({
                'color': (d: ChicletSlicerDataPoint) => {
                    if (d.mouseOver) {
                        return this.slicerSettings.slicerText.hoverColor;
                    }

                    if (d.mouseOut) {
                        if (d.selected) {
                            return this.slicerSettings.slicerText.fontColor;
                        } else {
                            return this.slicerSettings.slicerText.fontColor;
                        }
                    }
                }
            });
        }

        public styleSlicerInputs(slicers: Selection<any>, ids: ISelectionId[]) {
            let settings = this.slicerSettings;

            slicers.each(function (d: ChicletSlicerDataPoint) {
                // get selected items
                d.selected = _.some(ids, d.identity);

                d3.select(this).style({
                    'background': d.selectable ? (d.selected ? settings.slicerText.selectedColor : settings.slicerText.unselectedColor)
                        : settings.slicerText.disabledColor
                });

                d3.select(this).classed('slicerItem-disabled', !d.selectable);
            });
        }

    }

}
